package com.michelin0.michelinzerostar.global.security.oauth.handler;

import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import com.michelin0.michelinzerostar.global.security.jwt.TokenDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisUtil redisUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // CustomOAuth2UserService에서 넣어둔 속성들 꺼내기
        String email = (String) oAuth2User.getAttributes().get("email");
        String provider = (String) oAuth2User.getAttributes().get("provider");
        String socialAccessToken = (String) oAuth2User.getAttribute("socialToken");

        // Redis에 소셜 토큰 저장 (로그아웃/탈퇴용)
        if (socialAccessToken != null) {
            redisUtil.setDataExpire("SocialToken:" + email, socialAccessToken, 3600L);
        }

        TokenDto tokenDto = jwtTokenProvider.createToken(email, "USER", provider);

        log.info("[ACCESS TOKEN]: {}", tokenDto.getAccessToken());

        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/auth/callback")
                .queryParam("accessToken", tokenDto.getAccessToken())
                .build().encode(StandardCharsets.UTF_8).toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}