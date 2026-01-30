package com.michelin0.michelinzerostar.domain.auth.service;

import com.michelin0.michelinzerostar.domain.auth.dto.JoinRequestDto;
import com.michelin0.michelinzerostar.domain.auth.dto.LoginRequestDto;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.AuthErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import com.michelin0.michelinzerostar.global.security.jwt.TokenDto;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationConfiguration authenticationConfiguration;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisUtil redisUtil;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.security.oauth2.client.registration.naver.client-id}")
    private String naverClientId;

    @Value("${spring.security.oauth2.client.registration.naver.client-secret}")
    private String naverClientSecret;

    @Transactional
    public Long join(JoinRequestDto requestDto) {
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new GlobalException(AuthErrorCode.DUPLICATE_EMAIL);
        }
        if (userRepository.existsByNickname(requestDto.getNickname())) {
            throw new GlobalException(AuthErrorCode.DUPLICATE_NICKNAME);
        }
        User user = requestDto.toEntity(passwordEncoder);
        return userRepository.save(user).getId();
    }

    @Transactional
    public TokenDto login(LoginRequestDto requestDto) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(requestDto.getEmail(),
                        requestDto.getPassword());

        AuthenticationManager authenticationManager;
        try {
            authenticationManager = authenticationConfiguration.getAuthenticationManager();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        Authentication authentication = authenticationManager.authenticate(authenticationToken);
        return jwtTokenProvider.createToken(authentication);
    }

    // 재발급 로직
    @Transactional
    public TokenDto reissue(String refreshToken) {
        // Refresh Token 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Refresh Token이 유효하지 않습니다.");
        }

        // Redis에서 저장된 토큰 가져오기
        Authentication authentication = jwtTokenProvider.getAuthentication(refreshToken);
        String redisRefreshToken = redisUtil.getRefreshToken(authentication.getName());

        if (redisRefreshToken == null || !refreshToken.equals(redisRefreshToken)) {
            throw new RuntimeException("토큰 정보가 일치하지 않습니다.");
        }

        // Refresh Token 남은 시간 체크
        Long remainingTime = jwtTokenProvider.getExpiration(refreshToken);

        System.out.println("====== [DEBUG] 남은 시간: " + remainingTime + "ms ======");

        // 만료 기간이 3일 이상 남았으면? -> Refresh Token 갱신 안 함
        long threeDaysInMillis = 1000L * 60 * 60;

        if (remainingTime > threeDaysInMillis) {
            System.out.println("====== [DEBUG] 기존 토큰 유지 (로그인 풀림 방지 성공) ======");
            // Access Token만 새로 생성
            String newAccessToken = jwtTokenProvider.createAccessToken(authentication);

            return TokenDto.builder()
                    .grantType("Bearer")
                    .accessToken(newAccessToken)
                    .refreshToken(refreshToken) // 기존 토큰 그대로 반환
                    .accessTokenExpiresIn(System.currentTimeMillis() + 1000 * 60 * 30) // 30분 뒤 만료
                    .build();
        }
        System.out.println("====== [DEBUG] 새 토큰 교체 (로그인 풀림 위험) ======");
        return jwtTokenProvider.createToken(authentication);
    }

    @Transactional
    public void logout(String accessToken) {
        if (!jwtTokenProvider.validateToken(accessToken)) {
            throw new RuntimeException("유효하지 않는 토큰 입니다.");
        }

        Authentication authentication = jwtTokenProvider.getAuthentication(accessToken);
        String email = authentication.getName();

        if (redisUtil.getRefreshToken(email) != null) {
            redisUtil.deleteRefreshToken(email);
        }

        Long expiration = jwtTokenProvider.getExpiration(accessToken);
        redisUtil.setBlackList(accessToken, expiration);
    }

    @Transactional
    public void withdraw(Long userId, String accessToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));
        if (user.getSocialProvider() != null) {
            unlinkSocialAccount(user.getSocialProvider().name(), accessToken);
        }
        user.withdraw();
        redisUtil.deleteRefreshToken(user.getEmail());
        userRepository.save(user);
    }

    public void unlinkSocialAccount(String provider, String accessToken) {
        HttpHeaders headers = new HttpHeaders();

        if ("kakao".equalsIgnoreCase(provider)) {
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>("", headers);
            restTemplate.postForEntity("https://kapi.kakao.com/v1/user/unlink", entity,
                    String.class);

        } else if ("naver".equalsIgnoreCase(provider)) {
            String url = "https://nid.naver.com/oauth2.0/token?grant_type=delete" +
                    "&client_id={client_id}" +
                    "&client_secret={client_secret}" +
                    "&access_token={access_token}" +
                    "&service_provider=NAVER";

            Map<String, String> params = new HashMap<>();
            params.put("client_id", naverClientId);
            params.put("client_secret", naverClientSecret);
            params.put("access_token", accessToken);

            restTemplate.getForObject(url, String.class, params);
        }
    }
}