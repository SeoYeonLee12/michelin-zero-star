package com.michelin0.michelinzerostar.domain.auth.controller;

import com.michelin0.michelinzerostar.domain.auth.dto.JoinRequestDto;
import com.michelin0.michelinzerostar.domain.auth.dto.LoginRequestDto;
import com.michelin0.michelinzerostar.domain.auth.dto.LoginResponseDto;
import com.michelin0.michelinzerostar.domain.auth.service.AuthService;
import com.michelin0.michelinzerostar.global.security.jwt.TokenDto;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 회원가입 JoinRequestDto에 설정한 유효성 검사(길이, 형식 등)가 @Valid를 통해 실행됩니다.
     */
    @PostMapping("/join")
    public ResponseEntity<String> join(@RequestBody @Valid JoinRequestDto requestDto) {
        authService.join(requestDto);
        return ResponseEntity.ok("회원가입 성공");
    }

    /**
     * 로그인 인증 성공 시 Access Token은 응답 바디로, Refresh Token은 HttpOnly 쿠키로 발급합니다.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody @Valid LoginRequestDto requestDto,
            HttpServletResponse response) {
        TokenDto tokenDto = authService.login(requestDto);

        // Refresh Token을 HttpOnly 쿠키로 설정
        setRefreshTokenCookie(response, tokenDto.getRefreshToken());

        return ResponseEntity.ok(new LoginResponseDto(tokenDto.getAccessToken()));
    }

    /**
     * 토큰 재발급 (Silent Refresh) 쿠키에 담긴 Refresh Token을 확인하여 새로운 토큰 세트를 발급합니다.
     */
    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token 쿠키가 없습니다.");
        }

        try {
            TokenDto tokenDto = authService.reissue(refreshToken);

            // Refresh Token Rotation: 발급된 경우 쿠키 갱신
            if (tokenDto.getRefreshToken() != null) {
                setRefreshTokenCookie(response, tokenDto.getRefreshToken());
            }

            return ResponseEntity.ok(new LoginResponseDto(tokenDto.getAccessToken()));

        } catch (RuntimeException e) {
            log.warn("토큰 재발급 실패: {}", e.getMessage());

            // 유효하지 않은 토큰인 경우 쿠키 삭제
            ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                    .maxAge(0)
                    .path("/")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("토큰이 유효하지 않습니다: " + e.getMessage());
        }
    }

    /**
     * 로그아웃 서버 측 로그아웃 처리(Blacklist 등) 후 브라우저의 리프레시 토큰 쿠키를 제거합니다.
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String accessToken,
            HttpServletResponse response
    ) {
        String resolvedToken = resolveToken(accessToken);
        if (resolvedToken != null) {
            authService.logout(resolvedToken);
        }

        // 리프레시 토큰 쿠키 삭제
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .maxAge(0)
                .path("/")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok("로그아웃 되었습니다.");
    }

    /**
     * Refresh Token 쿠키 설정 로직 보안과 크로스 도메인 이슈를 고려하여 설정합니다.
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        // [참고] 실서버(HTTPS) 배포 시 아래 secure(true), sameSite("None") 설정이 권장됩니다.
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .maxAge(7 * 24 * 60 * 60) // 7일
                .path("/")
                .httpOnly(true)           // JS 접근 차단 (XSS 방지)
                .secure(false)           // 로컬 환경: false / 배포 환경: true (HTTPS 필수)
                .sameSite("Lax")         // CSRF 방지 및 일반적인 크로스 도메인 허용
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String resolveToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return token;
    }
}