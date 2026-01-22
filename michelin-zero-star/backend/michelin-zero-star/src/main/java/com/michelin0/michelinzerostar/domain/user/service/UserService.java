package com.michelin0.michelinzerostar.domain.user.service;

import com.michelin0.michelinzerostar.domain.user.dto.UserResponseDto;
import com.michelin0.michelinzerostar.domain.user.dto.UserUpdateRequestDto;
import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisUtil redisUtil;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void deleteUser(String accessToken, String email, SocialProvider provider) {

        // 이메일 + 소셜 타입으로 정확한 유저 찾기
        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // DB에서 Soft Delete 처리
        user.recordDeleteTime();

        // Redis에서 Refresh Token 삭제
        if (redisUtil.getRefreshToken(email) != null) {
            redisUtil.deleteRefreshToken(email);
        }

        // 현재 Access Token 블랙리스트 등록 (즉시 로그아웃)
        Long expiration = jwtTokenProvider.getExpiration(accessToken);
        redisUtil.setBlackList(accessToken, expiration);
    }

    @Transactional
    public void updateUser(String email, SocialProvider provider, UserUpdateRequestDto requestDto) {

        // 이메일 + 소셜 타입으로 정확한 유저 찾기
        User user = userRepository.findByEmailAndSocialProvider(email, provider)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 프로필 정보 수정 (Null 체크 필수)
        user.updateProfile(requestDto.getName(), requestDto.getNickname());

        // 비밀번호 변경 로직
        if (requestDto.getNewPassword() != null && !requestDto.getNewPassword().isBlank()) {

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

            if (user.getPassword() != null && passwordEncoder.matches(requestDto.getNewPassword(),
                    user.getPassword())) {
                throw new RuntimeException("새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다.");
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