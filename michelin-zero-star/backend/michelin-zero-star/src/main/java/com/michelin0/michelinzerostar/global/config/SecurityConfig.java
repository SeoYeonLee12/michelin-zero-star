package com.michelin0.michelinzerostar.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.michelin0.michelinzerostar.global.exception.errorcode.AuthErrorCode;
import com.michelin0.michelinzerostar.global.exception.response.ErrorResponse;
import com.michelin0.michelinzerostar.global.security.auth.CustomUserDetailsService;
import com.michelin0.michelinzerostar.global.security.jwt.JwtAuthenticationFilter;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import com.michelin0.michelinzerostar.global.security.oauth.handler.OAuth2SuccessHandler;
import com.michelin0.michelinzerostar.global.security.oauth.service.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Slf4j
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        ObjectMapper objectMapper = new ObjectMapper();

        http
                // CORS 설정 적용
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 기본 보안 설정 (CSRF, FormLogin 등 비활성화)
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(
                        HeadersConfigurer.FrameOptionsConfig::sameOrigin)) // H2 Console 등을 위해 필요
                .sessionManagement(
                        session -> session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS)) // JWT 사용하므로 세션 끔

                // 요청별 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // [정적 리소스]
                        .requestMatchers("/css/**", "/images/**", "/js/**", "/favicon.*",
                                "/*/icon-*").permitAll()

                        // [Swagger UI & API Docs]
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/api-docs/**"
                        ).permitAll()

                        // [공개 API]
                        .requestMatchers(
                                "/",
                                "/error",
                                "/api/v1/auth/**",
                                "/v1/auth/**",
                                "/h2-console/**"
                        ).permitAll()

                        // [WebSocket]
                        .requestMatchers(
                                "/ws-stomp/**",
                                "/ws/connect/**"
                        ).permitAll()

                        // [GET 요청 허용] - 레시피 조회 등
                        .requestMatchers(HttpMethod.GET, "/api/recipes/**").permitAll()

                        // [나머지 모든 요청] - 인증 필요
                        .anyRequest().authenticated()
                )

                // JWT 필터
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class)

                // OAuth2 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"error\": \"OAuth2 Login Failed\"}");
                        })
                )

                // 예외 처리 (인증/인가 실패 시 JSON 응답)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            log.error("인증 실패 (401) - URL: {}", request.getRequestURI());
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            ErrorResponse errorResponse = ErrorResponse.from(
                                    AuthErrorCode.AUTHENTICATION_FAILED);
                            response.getWriter()
                                    .write(objectMapper.writeValueAsString(errorResponse));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            log.error("권한 없음 (403) - URL: {}", request.getRequestURI());
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            ErrorResponse errorResponse = ErrorResponse.from(
                                    AuthErrorCode.ACCESS_DENIED);
                            response.getWriter()
                                    .write(objectMapper.writeValueAsString(errorResponse));
                        })
                );

        return http.build();
    }

    // CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // [수정 전] 특정 도메인만 허용되어 있어서, 로컬 파일(html) 실행 시 막힘
        /* configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:8080",
                "http://localhost:8081",
                "https://i14b208.p.ssafy.io"
        ));
        */

        // [수정 후] 테스트를 위해 "모든 주소(*)" 허용으로 변경
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(
                Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Collections.singletonList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}