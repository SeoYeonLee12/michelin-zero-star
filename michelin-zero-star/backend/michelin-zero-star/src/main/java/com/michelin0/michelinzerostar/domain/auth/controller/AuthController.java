package com.michelin0.michelinzerostar.domain.auth.controller;

import com.michelin0.michelinzerostar.domain.auth.dto.JoinRequestDto;
import com.michelin0.michelinzerostar.domain.auth.dto.LoginRequestDto;
import com.michelin0.michelinzerostar.domain.auth.dto.LoginResponseDto;
import com.michelin0.michelinzerostar.domain.auth.service.AuthService;
import com.michelin0.michelinzerostar.global.security.jwt.TokenDto;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입
    @PostMapping("/join")
    public ResponseEntity<String> join(@RequestBody @Valid JoinRequestDto requestDto) {
        authService.join(requestDto);
        return ResponseEntity.ok("회원가입 성공");
    }

    // 로그인 (쿠키 발급)
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody @Valid LoginRequestDto requestDto, HttpServletResponse response) {
        TokenDto tokenDto = authService.login(requestDto);

        // Refresh Token을 HttpOnly 쿠키로 설정
        setRefreshTokenCookie(response, tokenDto.getRefreshToken());

        return ResponseEntity.ok(new LoginResponseDto(tokenDto.getAccessToken()));
    }

    // 토큰 재발급 (Silent Refresh)
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

            // 성공 시: 리프레시 토큰 갱신 (Rotation)
            if (tokenDto.getRefreshToken() != null) {
                setRefreshTokenCookie(response, tokenDto.getRefreshToken());
            }

            return ResponseEntity.ok(new LoginResponseDto(tokenDto.getAccessToken()));

        } catch (RuntimeException e) {
            log.warn("토큰 재발급 실패: {}", e.getMessage());

            // 쿠키 삭제 (잘못된 토큰 제거)
            ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                    .maxAge(0)
                    .path("/")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("토큰이 유효하지 않습니다: " + e.getMessage());
        }
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String accessToken,
            HttpServletResponse response
    ) {
        String resolvedToken = resolveToken(accessToken);
        if (resolvedToken != null) {
            authService.logout(resolvedToken);
        }

        // 쿠키 삭제
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .maxAge(0)
                .path("/")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok("로그아웃 되었습니다.");
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .maxAge(7 * 24 * 60 * 60) // 7일
                .path("/")
                .secure(false) // 로컬: false, 배포: true
                .sameSite("Lax")
                .httpOnly(true)
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