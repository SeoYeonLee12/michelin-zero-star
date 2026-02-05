package com.michelin0.michelinzerostar.global.security.oauth.handler;

import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import com.michelin0.michelinzerostar.global.security.jwt.TokenDto;
import jakarta.annotation.PostConstruct;
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
    private final com.michelin0.michelinzerostar.global.security.oauth.HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        log.info("=========================================");
        log.info("OAuth2SuccessHandler Initialized");
        log.info("Frontend URL: {}", frontendUrl);
        log.info("=========================================");
    }

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

        // HTTPS 여부 확인 (기본값 설정)
        boolean isSecure = request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));

        // [수정] 동적 리다이렉트 처리
        // 1. 쿠키에 저장된 redirect_uri가 있으면 그걸 최우선으로 사용
        // 2. 없으면 기본 설정된 frontendUrl 사용
        // 3. 그것도 없으면 Referer 헤더 사용
        String targetFrontendUrl = frontendUrl;
        
        // 쿠키에서 redirect_uri 확인 (HttpCookieOAuth2AuthorizationRequestRepository에서 "redirect_uri" 쿠키를 저장한다고 가정)
        // 현재 코드엔 해당 로직이 없으므로, 기본적으로는 .env의 APP_FRONTEND_URL을 따르되,
        // 로컬/운영 분기를 위해 Referer나 Origin을 활용할 수 있음.

        // 여기서는 간단히: frontendUrl이 "http://localhost:3000" (기본값) 이거나 설정되어 있으면 그걸 씁니다.
        // 하지만 "Both"를 지원하려면 클라이언트가 로그인 시작할 때 보낸 redirect_uri 파라미터를 쿠키에 저장했다가 꺼내 쓰는게 정석입니다.
        // HttpCookieOAuth2AuthorizationRequestRepository가 이미 redirect_uri 쿠키를 처리하고 있다면 아래와 같이 가져올 수 있습니다.
        
        // (간소화) 일단은 설정된 frontendUrl을 사용하되, 만약 요청이 localhost로 왔다면 localhost로 보내는 등의 로직 추가 가능
        // 하지만 가장 확실한 건 클라이언트가 보낸 값을 믿는 것입니다.
        
        // 여기서는 기존 로직 유지하되, application.yml의 {baseUrl} 변경에 맞춰 동작함.
        // 사용자가 "localhost:3000" 접속 -> 백엔드 Login 시작 -> 백엔드가 {baseUrl}로 구글에 요청 -> 구글이 백엔드로 리턴
        // -> 백엔드가 성공 핸들러 실행 -> 여기서 targetFrontendUrl로 리다이렉트
        
        // 만약 frontendUrl이 고정되어 있으면 무조건 거기로 감.
        // 따라서 "Both"를 위해서는 SuccessHandler도 동적으로 바뀌어야 함.
        
        // [임시 해결책] 요청정보를 보고 판단
        String referer = request.getHeader("Referer");
        if (referer != null && referer.contains("localhost:3000")) {
            targetFrontendUrl = "http://localhost:3000";
        } else if (frontendUrl != null && !frontendUrl.isEmpty()) {
            targetFrontendUrl = frontendUrl;
        } else {
             targetFrontendUrl = "http://localhost:3000";
        }

        log.info("Determined Target Frontend URL: {}", targetFrontendUrl);

        // Refresh Token을 HttpOnly 쿠키로 굽기
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenDto.getRefreshToken())
                .httpOnly(true)
                .secure(isSecure) // HTTPS일 경우 true, HTTP일 경우 false
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax") // 리다이렉트 흐름에서 쿠키 유지를 위해 Lax 권장
                .build();

        response.addHeader("Set-Cookie", refreshCookie.toString());

        String targetUrl = UriComponentsBuilder.fromUriString(targetFrontendUrl + "/auth/callback")
                .queryParam("accessToken", tokenDto.getAccessToken())
                .build().encode(StandardCharsets.UTF_8).toUriString();

        log.info("Redirecting to: {}", targetUrl); // 로그로 확인
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}