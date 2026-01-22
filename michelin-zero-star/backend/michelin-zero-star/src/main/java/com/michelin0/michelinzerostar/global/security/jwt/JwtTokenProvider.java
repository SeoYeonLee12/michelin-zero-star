package com.michelin0.michelinzerostar.global.security.jwt;

import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.global.redis.RedisUtil;
import com.michelin0.michelinzerostar.global.security.auth.CustomUserDetailsService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtTokenProvider {

    private final Key key;
    private final long accessTokenValidityInMilliseconds;
    private final long refreshTokenValidityInMilliseconds;
    private final RedisUtil redisUtil;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity-in-seconds}") long accessTokenValidityInSeconds,
            @Value("${jwt.refresh-token-validity-in-seconds}") long refreshTokenValidityInSeconds,
            RedisUtil redisUtil,
            CustomUserDetailsService customUserDetailsService) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenValidityInMilliseconds = accessTokenValidityInSeconds * 1000;
        this.refreshTokenValidityInMilliseconds = refreshTokenValidityInSeconds * 1000;
        this.redisUtil = redisUtil;
        this.customUserDetailsService = customUserDetailsService;
    }

    // 소셜 로그인용 (SuccessHandler에서 사용)
    public TokenDto createToken(String email, String role, String provider) {
        return generateToken(email, role, provider);
    }

    // 일반 로그인/테스트용 (Authentication 객체 사용)
    public TokenDto createToken(Authentication authentication) {
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        return generateToken(authentication.getName(), authorities, "LOCAL");
    }

    // 공통 토큰 생성 로직
    private TokenDto generateToken(String subject, String authorities, String provider) {
        long now = (new Date()).getTime();
        Date accessTokenExpiresIn = new Date(now + accessTokenValidityInMilliseconds);
        Date refreshTokenExpiresIn = new Date(now + refreshTokenValidityInMilliseconds);

        String accessToken = Jwts.builder()
                .setSubject(subject)
                .claim("auth", authorities)
                .claim("provider", provider)
                .setExpiration(accessTokenExpiresIn)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        String refreshToken = Jwts.builder()
                .setExpiration(refreshTokenExpiresIn)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        redisUtil.setRefreshToken(subject, refreshToken, refreshTokenValidityInMilliseconds);

        return TokenDto.builder()
                .grantType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(accessTokenExpiresIn.getTime())
                .build();
    }

    // 토큰에서 인증 정보 조회
    public Authentication getAuthentication(String accessToken) {
        Claims claims = parseClaims(accessToken);

        if (claims.get("auth") == null) {
            throw new RuntimeException("권한 정보가 없는 토큰입니다.");
        }

        String email = claims.getSubject();
        String providerStr = (String) claims.get("provider");

        UserDetails userDetails;

        // Provider가 유효하면 소셜 로그인 방식으로 조회
        if (providerStr != null && !providerStr.equals("LOCAL") && !providerStr.equals("EMPTY")) {
            try {
                SocialProvider provider = SocialProvider.valueOf(providerStr);
                userDetails = customUserDetailsService.loadUserByEmailAndProvider(email, provider);
            } catch (IllegalArgumentException e) {
                // 혹시라도 이상한 문자열이 들어오면 일반 조회 시도
                userDetails = customUserDetailsService.loadUserByUsername(email);
            }
        } else {
            userDetails = customUserDetailsService.loadUserByUsername(email);
        }

        return new UsernamePasswordAuthenticationToken(userDetails, "",
                userDetails.getAuthorities());
    }

    public String getSocialProvider(String token) {
        Claims claims = parseClaims(token);
        String provider = (String) claims.get("provider");

        // null이거나 없으면 기본값 처리 (혹은 에러 처리)
        if (provider == null) {
            return "LOCAL"; // 또는 예외 발생
        }
        return provider;
    }

    // [6] 토큰 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            if (redisUtil.hasKeyBlackList(token)) {
                log.warn("로그아웃 된 토큰입니다.");
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken)
                    .getBody();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    public Long getExpiration(String accessToken) {
        Date expiration = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(accessToken).getBody().getExpiration();
        long now = new Date().getTime();
        return (expiration.getTime() - now);
    }
}