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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
        // [핵심 수정] 생성자에 customUserDetailsService 주입
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(
                customUserDetailsService);
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
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(
                        HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 정적 리소스 허용
                        .requestMatchers("/css/**", "/images/**", "/js/**", "/favicon.*",
                                "/*/icon-*").permitAll()

                        // [핵심 수정] 인증 없이 접근 가능한 URL 목록
                        .requestMatchers(
                                "/",
                                "/error",
                                "/api/v1/auth/**", // 회원가입, 로그인 등 auth 하위 경로 모두 허용
                                "/api/users/login", // 혹시 몰라 기존 경로도 유지
                                "/api/users/signup",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/h2-console/**"
                        ).permitAll()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class)
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"error\": \"OAuth2 Login Failed\"}");
                        })
                )
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
}