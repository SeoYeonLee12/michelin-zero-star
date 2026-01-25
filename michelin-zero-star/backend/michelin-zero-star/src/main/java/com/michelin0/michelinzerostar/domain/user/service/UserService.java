package com.michelin0.michelinzerostar.domain.user.service;

import com.michelin0.michelinzerostar.domain.auth.service.AuthService;
import com.michelin0.michelinzerostar.domain.user.dto.UserResponseDto;
import com.michelin0.michelinzerostar.domain.user.dto.UserUpdateRequestDto;
import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.AuthErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
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
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisUtil redisUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional
    public void deleteUser(String accessToken, String email, SocialProvider provider) {

        // 이메일 + 소셜 타입으로 정확한 유저 찾기
        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 소셜 로그인 유저라면 Redis에서 소셜 전용 토큰을 가져와 연동 해제
        if (!provider.equals(SocialProvider.LOCAL)) {
            // Redis에 저장해둔 진짜 카카오/네이버 토큰 조회
            String socialToken = redisUtil.getData("SocialToken:" + email);

            if (socialToken != null) {
                // JWT가 아닌 진짜 소셜 토큰을 넘겨줌
                authService.unlinkSocialAccount(provider.name(), socialToken);
                redisUtil.deleteData("SocialToken:" + email); // 사용 후 삭제
            } else {
                log.warn("소셜 연동 해제를 시도했으나 Redis에 토큰이 없습니다. (이메일: {})", email);
            }
        }

        // DB Soft Delete 처리 (이메일 마스킹 + recordDeleteTime 포함)
        user.withdraw();

        // Redis에서 Refresh Token 삭제
        if (redisUtil.getRefreshToken(email) != null) {
            redisUtil.deleteRefreshToken(email);
        }

        // 5. 현재 사용 중인 JWT Access Token 블랙리스트 등록
        Long expiration = jwtTokenProvider.getExpiration(accessToken);
        redisUtil.setBlackList(accessToken, expiration);
    }

    @Transactional
    public void updateUser(String email, SocialProvider provider, UserUpdateRequestDto requestDto) {

        // 이메일 + 소셜 타입으로 정확한 유저 찾기
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

        // 프로필 정보 수정 (Null 체크 필수)
        user.updateProfile(null, requestDto.getNickname(), null);

        // 비밀번호 변경 로직
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

            // 기존 비밀번호와 중복
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