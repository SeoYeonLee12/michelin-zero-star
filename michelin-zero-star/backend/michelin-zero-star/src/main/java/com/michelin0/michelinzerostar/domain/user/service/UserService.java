package com.michelin0.michelinzerostar.domain.user.service;

import com.michelin0.michelinzerostar.domain.auth.service.AuthService;
import com.michelin0.michelinzerostar.domain.category.domain.Category;
import com.michelin0.michelinzerostar.domain.category.domain.CategoryRepository;
import com.michelin0.michelinzerostar.domain.user.dto.UserResponseDto;
import com.michelin0.michelinzerostar.domain.user.dto.UserUpdateRequestDto;
import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.entity.UserFavoriteCategory;
import com.michelin0.michelinzerostar.domain.user.entity.UserProfile;
import com.michelin0.michelinzerostar.domain.user.repository.UserFavoriteCategoryRepository;
import com.michelin0.michelinzerostar.domain.user.repository.UserProfileRepository;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.AuthErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import com.michelin0.michelinzerostar.global.util.KakaoMapService;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
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
    private final UserProfileRepository userProfileRepository;
    private final UserFavoriteCategoryRepository userFavoriteCategoryRepository;
    private final CategoryRepository categoryRepository;

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisUtil redisUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final KakaoMapService kakaoMapService;

    // 사용자 위치 인증/업데이트
    @Transactional
    public String updateUserLocation(String email, BigDecimal latitude, BigDecimal longitude) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        KakaoMapService.AddressInfo addressInfo = kakaoMapService.getAddressFromCoords(latitude, longitude);

        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseGet(() -> UserProfile.builder()
                        .user(user)
                        .locationAddress(addressInfo.fullAddress())
                        .locationCode(addressInfo.code())
                        .latitude(latitude)
                        .longitude(longitude)
                        .isVerified(true)
                        .build());

        profile.updateLocation(addressInfo.fullAddress(), addressInfo.code(), latitude, longitude);
        userProfileRepository.save(profile);

        return addressInfo.dongName();
    }

    // 회원 탈퇴
    @Transactional
    public void deleteUser(String accessToken, String email, SocialProvider provider) {
        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 소셜 유저라면 소셜 연동 해제 시도
        if (!provider.equals(SocialProvider.LOCAL)) {
            String socialToken = redisUtil.getData("SocialToken:" + email);

            if (socialToken != null) {
                authService.unlinkSocialAccount(provider.name(), socialToken);
                redisUtil.deleteData("SocialToken:" + email);
            } else {
                log.warn("소셜 연동 해제를 시도했으나 Redis에 토큰이 없습니다. (이메일: {})", email);
            }
        }

        user.withdraw(); // Soft Delete 등 탈퇴 처리

        // 리프레시 토큰 삭제
        if (redisUtil.getRefreshToken(email) != null) {
            redisUtil.deleteRefreshToken(email);
        }

        // 액세스 토큰 블랙리스트 처리
        Long expiration = jwtTokenProvider.getExpiration(accessToken);
        redisUtil.setBlackList(accessToken, expiration);
    }

    // 내 정보 조회
    @Transactional(readOnly = true)
    public UserResponseDto getUser(String email, SocialProvider provider) {
        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저가 없습니다."));

        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElse(null);

        // 관심 카테고리 조회
        List<UserFavoriteCategory> favoriteCategories = userFavoriteCategoryRepository.findAllByUserId(user.getId());

        List<String> categoryNames = favoriteCategories.stream()
                .map(favorite -> favorite.getCategory().getCategoryName())
                .collect(Collectors.toList());

        // 프로필 정보가 있는 경우와 없는 경우 분기 (Builder)
        UserResponseDto.UserResponseDtoBuilder builder = UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole())
                .totalStar(user.getTotalStar())
                .socialProvider(user.getSocialProvider())
                .categories(categoryNames);

        if (profile != null) {
            builder.location(profile.getLocationAddress())
                    .isVerified(profile.isVerified());
        }

        return builder.build();
    }

    // 내 정보 수정
    @Transactional
    public UserResponseDto updateUser(String email, SocialProvider provider, UserUpdateRequestDto requestDto) {
        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 닉네임 변경 및 중복 체크
        String newNickName = requestDto.getNickname();
        if (newNickName != null && !newNickName.isBlank()) {
            if (newNickName.equals(user.getNickname())) {
                throw new GlobalException(AuthErrorCode.SAME_AS_OLD_NICKNAME);
            }
            if (userRepository.existsByNickname(newNickName)) {
                throw new GlobalException(AuthErrorCode.DUPLICATE_NICKNAME);
            }
        }

        // 프로필 업데이트 (닉네임, 이미지 등)
        user.updateProfile(null, requestDto.getNickname(), requestDto.getProfileImageUrl());

        // 관심 카테고리 업데이트
        if (requestDto.getCategories() != null) {
            userFavoriteCategoryRepository.deleteByUserId(user.getId()); // 기존 카테고리 삭제

            for (String categoryName : requestDto.getCategories()) {
                Category category = categoryRepository.findByCategoryName(categoryName)
                        .orElseThrow(() -> new IllegalArgumentException("해당 카테고리를 찾을 수 없습니다: " + categoryName));

                UserFavoriteCategory userFavoriteCategory = UserFavoriteCategory.builder()
                        .user(user)
                        .category(category)
                        .build();

                userFavoriteCategoryRepository.save(userFavoriteCategory);
            }
        }

        // 비밀번호 변경 (로컬 유저만 해당)
        if (provider == SocialProvider.LOCAL
                && requestDto.getNewPassword() != null
                && !requestDto.getNewPassword().isBlank()) {

            if (requestDto.getCurrentPassword() == null || requestDto.getCurrentPassword().isBlank()) {
                throw new RuntimeException("현재 비밀번호를 입력해주세요.");
            }
            if (requestDto.getNewPasswordConfirm() == null || requestDto.getNewPasswordConfirm().isBlank()) {
                throw new RuntimeException("새 비밀번호 확인을 입력해주세요.");
            }
            if (user.getPassword() != null && !passwordEncoder.matches(requestDto.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
            }
            if (!requestDto.getNewPassword().equals(requestDto.getNewPasswordConfirm())) {
                throw new RuntimeException("새 비밀번호가 일치하지 않습니다.");
            }
            if (user.getPassword() != null && passwordEncoder.matches(requestDto.getNewPassword(), user.getPassword())) {
                throw new GlobalException(AuthErrorCode.SAME_AS_OLD_PASSWORD);
            }

            String encodedPassword = passwordEncoder.encode(requestDto.getNewPassword());
            user.updatePassword(encodedPassword);
        }

        // 업데이트된 카테고리 목록 조회
        List<String> categories = userFavoriteCategoryRepository.findAllByUserId(user.getId()).stream()
                .map(ufc -> ufc.getCategory().getCategoryName())
                .collect(Collectors.toList());

        // 프로필 정보 조회 (위치/인증 정보 포함용)
        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);

        // 응답 DTO 반환
        UserResponseDto.UserResponseDtoBuilder builder = UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .categories(categories) // ★ 업데이트된 카테고리 목록 포함
                .socialProvider(user.getSocialProvider())
                .totalStar(user.getTotalStar())
                .role(user.getRole());

        if (profile != null) {
            builder.location(profile.getLocationAddress())
                    .isVerified(profile.isVerified());
        }

        return builder.build();
    }
}