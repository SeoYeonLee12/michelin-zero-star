package com.michelin0.michelinzerostar.domain.user.service;

import com.michelin0.michelinzerostar.domain.auth.service.AuthService;
import com.michelin0.michelinzerostar.domain.user.dto.UserResponseDto;
import com.michelin0.michelinzerostar.domain.user.dto.UserUpdateRequestDto;
import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.entity.UserProfile;
import com.michelin0.michelinzerostar.domain.user.repository.UserProfileRepository;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.AuthErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import com.michelin0.michelinzerostar.global.util.KakaoMapService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository; // 필드 추가
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisUtil redisUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final KakaoMapService kakaoMapService;

    @Transactional
    public String updateUserLocation(String email, BigDecimal latitude, BigDecimal longitude) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        // 카카오 API로 좌표 -> 주소 변환
        KakaoMapService.AddressInfo addressInfo = kakaoMapService.getAddressFromCoords(latitude,
                longitude);

        // 프로필 찾기 (없으면 생성)
        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseGet(() -> UserProfile.builder()
                        .user(user)
                        .locationAddress(addressInfo.fullAddress())
                        .locationCode(addressInfo.code())
                        .latitude(latitude)   // [중요] 생성 시 위도 저장
                        .longitude(longitude) // [중요] 생성 시 경도 저장
                        .isVerified(true)     // 생성 즉시 인증됨
                        .build());

        // 정보 업데이트 (Dirty Checking)
        profile.updateLocation(addressInfo.fullAddress(), addressInfo.code(), latitude, longitude);
        userProfileRepository.save(profile);

        return addressInfo.dongName(); // "둔산동" 반환
    }

    @Transactional
    public void deleteUser(String accessToken, String email, SocialProvider provider) {

        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (!provider.equals(SocialProvider.LOCAL)) {
            String socialToken = redisUtil.getData("SocialToken:" + email);

            if (socialToken != null) {
                authService.unlinkSocialAccount(provider.name(), socialToken);
                redisUtil.deleteData("SocialToken:" + email);
            } else {
                log.warn("소셜 연동 해제를 시도했으나 Redis에 토큰이 없습니다. (이메일: {})", email);
            }
        }

        user.withdraw();

        if (redisUtil.getRefreshToken(email) != null) {
            redisUtil.deleteRefreshToken(email);
        }

        Long expiration = jwtTokenProvider.getExpiration(accessToken);
        redisUtil.setBlackList(accessToken, expiration);
    }

    @Transactional
    public void updateUser(String email, SocialProvider provider, UserUpdateRequestDto requestDto) {

        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        String newNickName = requestDto.getNickname();

        if (newNickName != null && !newNickName.isBlank()) {
            if (newNickName.equals(user.getNickname())) {
                throw new GlobalException(AuthErrorCode.SAME_AS_OLD_NICKNAME);
            }
            if (userRepository.existsByNickname(newNickName)) {
                throw new GlobalException(AuthErrorCode.DUPLICATE_NICKNAME);
            }
        }

        user.updateProfile(null, requestDto.getNickname(), null);

        if (provider == SocialProvider.LOCAL
                && requestDto.getNewPassword() != null
                && !requestDto.getNewPassword().isBlank()) {

            if (requestDto.getCurrentPassword() == null || requestDto.getCurrentPassword()
                    .isBlank()) {
                throw new RuntimeException("현재 비밀번호를 입력해주세요.");
            }
            if (requestDto.getNewPasswordConfirm() == null || requestDto.getNewPasswordConfirm()
                    .isBlank()) {
                throw new RuntimeException("새 비밀번호 확인을 입력해주세요.");
            }

            if (user.getPassword() != null && !passwordEncoder.matches(
                    requestDto.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
            }

            if (!requestDto.getNewPassword().equals(requestDto.getNewPasswordConfirm())) {
                throw new RuntimeException("새 비밀번호가 일치하지 않습니다.");
            }

            if (user.getPassword() != null && passwordEncoder.matches(
                    requestDto.getNewPassword(), user.getPassword())) {
                throw new GlobalException(AuthErrorCode.SAME_AS_OLD_PASSWORD);
            }

            String encodedPassword = passwordEncoder.encode(requestDto.getNewPassword());
            user.updatePassword(encodedPassword);
        }
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUser(String email, SocialProvider provider) {
        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저가 없습니다."));
        return new UserResponseDto(user);
    }
}