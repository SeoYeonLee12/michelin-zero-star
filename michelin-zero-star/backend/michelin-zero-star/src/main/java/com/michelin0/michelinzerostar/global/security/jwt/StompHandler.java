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
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class StompHandler implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // 클라이언트가 'CONNECT' 명령을 보낼 때 토큰 검증 수행
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");

            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            // 토큰이 없거나 유효하지 않으면 연결 거부 (예외 발생)
            if (token == null || !jwtTokenProvider.validateToken(token)) {
                log.error("유효하지 않은 웹소켓 토큰입니다.");
                throw new RuntimeException("Invalid WebSocket Token");
            }

            log.info("웹소켓 연결 승인: {}", jwtTokenProvider.getEmailFromRefreshToken(token));
        }
        return message;
    }
}