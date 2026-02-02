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
        // [수정됨] 생성자 주입 대신 Setter 메서드 사용
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService); // 여기서 주입
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
                // CORS 설정 추가
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

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

                        // GET 요청만 허용
                        .requestMatchers(HttpMethod.GET, "/api/recipes/**").permitAll()

                        // 로그인, 회원가입, 재발급, 웹소켓 연결허용
                        .requestMatchers(
                                "/",
                                "/error",
                                "/api/v1/auth/**",
                                "/ws-stomp/**", // 웹소켓 핸드셰이크 허용
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/h2-console/**",
                                // 웹소켓 연결 허용
                                "/ws/connect/**"
                        ).permitAll()

                        // 나머지는 인증 필요
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

    // CORS 설정 빈 등록
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 로컬 개발용: 모든 출처 허용
        configuration.setAllowedOriginPatterns(Collections.singletonList("*"));

        // 허용할 HTTP 메서드 설정
        configuration.setAllowedMethods(
                Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 허용할 헤더 설정
        configuration.setAllowedHeaders(Collections.singletonList("*"));

        // 쿠키(Credential) 전송 허용
        configuration.setAllowCredentials(true);

        // 브라우저가 읽을 수 있게 허용할 헤더 (토큰 등)
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}