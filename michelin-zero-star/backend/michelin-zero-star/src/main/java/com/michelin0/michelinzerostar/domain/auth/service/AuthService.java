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

    // 네이버 연동 해제를 위한 설정값 주입 필드 추가
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