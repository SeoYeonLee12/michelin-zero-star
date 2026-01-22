package com.michelin0.michelinzerostar.domain.auth.service;

import com.michelin0.michelinzerostar.domain.auth.dto.JoinRequestDto;
import com.michelin0.michelinzerostar.domain.auth.dto.LoginRequestDto;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import com.michelin0.michelinzerostar.global.security.jwt.TokenDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    final AuthenticationConfiguration authenticationConfiguration;

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisUtil redisUtil;

    @Transactional
    public Long join(JoinRequestDto requestDto) {
        if (userRepository.findByEmail(requestDto.getEmail()).isPresent()) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }
        User user = requestDto.toEntity(passwordEncoder);
        return userRepository.save(user).getId();
    }

    @Transactional
    public TokenDto login(LoginRequestDto requestDto) {
        // ID/PW 기반 인증 토큰 생성
        // UsernamePasswordAuthenticationToken의 사용 목적은
        // 사용자로부터 입력 받은 사용자의 이름과 비밀번호를 AuthenticationManager에 전달하여 인증을 수행하는 것
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(requestDto.getUsername(),
                        requestDto.getPassword());

        // 로그인 로직이 실행될 때 Manager를 가져와서 사용
        AuthenticationManager authenticationManager;
        try {
            authenticationManager = authenticationConfiguration.getAuthenticationManager();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        // 2. 실제 검증 -> DB에 저장되어 있는 비밀번호와 사용자가 입력한 비밀번호가 일치하는지 확인
        // 일치하지 않으면 예외를 터트려 로그인을 실패 시킴
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        // 3. 토큰 생성
        return jwtTokenProvider.createToken(authentication);
    }

    @Transactional
    public void logout(String accessToken) {
        // 1. AcessToken 검증
        if (!jwtTokenProvider.validateToken(accessToken)) {
            throw new RuntimeException("유효하지 않는 토큰 입니다.");
        }

        // 2. 토큰 유저 이메일(Subject) 가져오기
        Authentication authentication = jwtTokenProvider.getAuthentication(accessToken);
        String email = authentication.getName();

        // 3. Redis에서 해당 유저의 Refresh Token 삭제 (재발급 불가능하게 만듦)
        if (redisUtil.getRefreshToken(email) != null) {
            redisUtil.deleteRefreshToken(email);
        }

        // 4. 해당 Access Token 유효시간을 가지고 와서 BlackList에 저장하기
        Long expiration = jwtTokenProvider.getExpiration(accessToken);
        redisUtil.setBlackList(accessToken, expiration);
    }
}