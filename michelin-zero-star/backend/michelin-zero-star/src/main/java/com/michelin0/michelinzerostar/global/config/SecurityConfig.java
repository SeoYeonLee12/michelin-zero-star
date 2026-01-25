package com.michelin0.michelinzerostar.global.config;

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
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.ObjectMapper;

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
    public SecurityFilterChain filterChain(HttpSecurity http, ObjectMapper objectMapper)
            throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 로그인 관련 경로 허용
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/login/**",
                                "/oauth2/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/error",
                                "/favicon.ico"
                        ).permitAll()
                        .anyRequest().authenticated()
                )

                // JWT 필터
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class)

                // 소셜 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            String jsonResponse =
                                    "{\"error\": \"OAuth2 Login Failed\", \"message\": \""
                                            + exception.getMessage().replace("\"", "'") + "\"}";

                            response.getWriter().write(jsonResponse);
                        })
                )

                .exceptionHandling(exception -> exception
                        // 로그인 실패 (401) 처리
                        .authenticationEntryPoint((request, response, authException) -> {
                            log.error("인증 실패 발생 (401): ", authException);

                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

                            ErrorResponse errorResponse = ErrorResponse.from(
                                    AuthErrorCode.AUTHENTICATION_FAILED);

                            // tools.jackson ObjectMapper로 변환
                            response.getWriter()
                                    .write(objectMapper.writeValueAsString(errorResponse));
                        })

                        // 권한 없음 (403) 처리
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            log.error("권한 없음 발생 (403): ", accessDeniedException);

                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);

                            ErrorResponse errorResponse = ErrorResponse.from(
                                    AuthErrorCode.ACCESS_DENIED);

                            // tools.jackson ObjectMapper로 변환
                            response.getWriter()
                                    .write(objectMapper.writeValueAsString(errorResponse));
                        })
                );

        return http.build();
    }
}