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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
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

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = (String) oAuth2User.getAttributes().get("email");
        String provider = (String) oAuth2User.getAttributes().get("provider");
        String socialAccessToken = (String) oAuth2User.getAttribute("socialToken");

        // Redis에 소셜 토큰 저장 (로그아웃/탈퇴용)
        if (socialAccessToken != null) {
            redisUtil.setDataExpire("SocialToken:" + email, socialAccessToken, 3600L);
        }

        TokenDto tokenDto = jwtTokenProvider.createToken(email, "USER", provider);

        log.info("[ACCESS TOKEN]: {}", tokenDto.getAccessToken());

        boolean isSecure = frontendUrl.startsWith("https");

        // Refresh Token을 HttpOnly 쿠키로 굽기
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenDto.getRefreshToken())
                .httpOnly(true)
                .secure(isSecure) // HTTPS일 경우 true, HTTP일 경우 false
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax") // 리다이렉트 흐름에서 쿠키 유지를 위해 Lax 권장
                .build();

        response.addHeader("Set-Cookie", refreshCookie.toString());

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/callback")
                .queryParam("accessToken", tokenDto.getAccessToken())
                .build().encode(StandardCharsets.UTF_8).toUriString();

        log.info("Redirecting to: {}", targetUrl); // 로그로 확인
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}