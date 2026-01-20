package com.michelin0.michelinzerostar.domain.auth.controller;

import com.michelin0.michelinzerostar.domain.auth.dto.JoinRequestDto;
import com.michelin0.michelinzerostar.domain.auth.dto.LoginRequestDto;
import com.michelin0.michelinzerostar.domain.auth.service.AuthService;
import com.michelin0.michelinzerostar.global.security.jwt.TokenDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<TokenDto> login(@RequestBody @Valid LoginRequestDto requestDto) {
        TokenDto tokenDto = authService.login(requestDto);
        return ResponseEntity.ok(tokenDto);
    }
}