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

    // 소셜 로그인용
    public TokenDto createToken(String email, String role, String provider) {
        return generateToken(email, role, provider);
    }

    // 일반 로그인용 (초기 로그인 시)
    public TokenDto createToken(Authentication authentication) {
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        return generateToken(authentication.getName(), authorities, "LOCAL");
    }

    /**
     * Access Token만 갱신하는 메서드
     * Refresh Token Rotation 문제를 해결하기 위해, Refresh Token 유효기간이 충분할 경우
     * Redis를 갱신하지 않고 Access Token만 새로 발급
     */
    public String createAccessToken(Authentication authentication) {
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        long now = (new Date()).getTime();
        Date accessTokenExpiresIn = new Date(now + accessTokenValidityInMilliseconds);

        return Jwts.builder()
                .setSubject(authentication.getName())
                .claim("auth", authorities)
                .claim("provider", "LOCAL")
                .setExpiration(accessTokenExpiresIn)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 내부적으로 토큰 생성 및 Redis 저장을 담당하는 메서드
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
                .setSubject(subject)
                .setExpiration(refreshTokenExpiresIn)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        // Refresh Token은 Redis에 저장
        redisUtil.setRefreshToken(subject, refreshToken, refreshTokenValidityInMilliseconds);

        return TokenDto.builder()
                .grantType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(accessTokenExpiresIn.getTime())
                .build();
    }

    public Authentication getAuthentication(String accessToken) {
        Claims claims = parseClaims(accessToken);

        if (claims.get("auth") == null) {
            throw new RuntimeException("권한 정보가 없는 토큰입니다.");
        }

        String email = claims.getSubject();
        String providerStr = (String) claims.get("provider");

        UserDetails userDetails;

        if (providerStr != null && !providerStr.equals("LOCAL") && !providerStr.equals("EMPTY")) {
            try {
                SocialProvider provider = SocialProvider.valueOf(providerStr);
                userDetails = customUserDetailsService.loadUserByEmailAndProvider(email, provider);
            } catch (IllegalArgumentException e) {
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
        if (provider == null) {
            return "LOCAL";
        }
        return provider;
    }

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

    /**
     * Refresh Token에서 이메일(Subject)을 추출하는 메서드
     * Refresh Token은 auth 클레임이 없으므로 getAuthentication을 사용할 수 없음
     */
    public String getEmailFromRefreshToken(String refreshToken) {
        Claims claims = parseClaims(refreshToken);
        return claims.getSubject();
    }

    public Long getExpiration(String token) {
        Date expiration = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getExpiration();
        long now = new Date().getTime();
        return (expiration.getTime() - now);
    }
}