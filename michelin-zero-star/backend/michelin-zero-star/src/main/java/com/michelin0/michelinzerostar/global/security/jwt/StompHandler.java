package com.michelin0.michelinzerostar.global.security.jwt;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class StompHandler implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message,
                StompHeaderAccessor.class);

        // accessor가 null일 경우 방어 로직 추가
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("📢 STOMP CONNECT 요청 도착");

            try {
                String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
                log.info("🔑 Authorization Header: {}", authorizationHeader);

                if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                    String token = authorizationHeader.substring(7);

                    if (jwtTokenProvider.validateToken(token)) {
                        Authentication authentication = jwtTokenProvider.getAuthentication(token);
                        accessor.setUser(authentication);
                        log.info("✅ STOMP 인증 성공: User={}", authentication.getName());
                    } else {
                        log.error("❌ STOMP 토큰 유효성 검사 실패");
                        throw new RuntimeException("Invalid JWT Token");
                    }
                } else {
                    // [중요] 토큰이 없으면 연결 차단!
                    log.error("❌ STOMP Authorization 헤더 누락 또는 형식 오류");
                    throw new RuntimeException("Authorization header is missing or invalid");
                }
            } catch (Exception e) {
                log.error("🚨 STOMP 연결 핸들링 중 에러: {}", e.getMessage());
                // 에러를 던져야 클라이언트 연결이 끊어짐
                throw new RuntimeException("Authentication failed", e);
            }
        }
        return message;
    }
}