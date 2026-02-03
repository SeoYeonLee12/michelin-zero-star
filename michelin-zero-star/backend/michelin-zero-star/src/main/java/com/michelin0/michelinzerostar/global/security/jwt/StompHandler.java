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
import org.springframework.security.access.AccessDeniedException; // ★ 추가된 Import
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
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // CONNECT 명령일 때만 토큰 검증 및 인증 정보 저장
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
            String token = null;

            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                token = authorizationHeader.substring(7);
            }

            // 토큰 유효성 검증
            if (token != null && jwtTokenProvider.validateToken(token)) {
                Authentication authentication = jwtTokenProvider.getAuthentication(token);
                accessor.setUser(authentication); // 인증 객체 저장
                log.info("WS CONNECT: 유저 인증 성공 - {}", authentication.getName());
            } else {
                log.error("WS CONNECT: 유저 인증 실패 (유효하지 않은 토큰)");
                throw new AccessDeniedException("유효하지 않은 토큰입니다.");
            }
        }
        return message;
    }
}