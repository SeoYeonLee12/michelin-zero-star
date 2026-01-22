package com.michelin0.michelinzerostar.global.security.oauth.handler;

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

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {

        // 로그인된 유저 정보 가져오기 (Google)
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String provider = (String) oAuth2User.getAttribute("provider");
        log.info("소셜 로그인 성공! 이메일: {}, 이름: {}", email, name);

        // JWT 토큰 생성 (Access + Refresh)
        // role은 "USER"로 고정하거나, DB에서 조회해서 넣을 수 있습니다.
        // createToken 메서드가 TokenDto를 반환한다고 가정합니다.
        TokenDto tokenDto = jwtTokenProvider.createToken(email, "USER", provider);

        // 프론트엔드(React/Vue)가 있다면 그쪽 주소(http://localhost:3000/...)를 적어야 함
        // 현재는 테스트를 위해 브라우저 주소창에서 토큰을 확인할 수 있도록 설정합니다.
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:8080/") // 메인 페이지 경로
                .queryParam("accessToken", tokenDto.getAccessToken())
                .queryParam("refreshToken", tokenDto.getRefreshToken())
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();

        // 4. 리다이렉트 수행
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}