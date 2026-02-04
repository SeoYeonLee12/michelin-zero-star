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

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // 🔍 [디버깅] 연결 요청이 들어옴을 로그로 확인
            log.info("STOMP CONNECT 요청 들어옴");

            try {
                String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
                log.info("Authorization Header: {}", authorizationHeader); // 헤더가 오는지 확인

                if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                    String token = authorizationHeader.substring(7);

                    if (jwtTokenProvider.validateToken(token)) {
                        Authentication authentication = jwtTokenProvider.getAuthentication(token);
                        accessor.setUser(authentication);
                        log.info("STOMP 인증 성공: {}", authentication.getName());
                    } else {
                        // 토큰이 유효하지 않음
                        log.error("STOMP 토큰 유효성 검사 실패");
                        throw new RuntimeException("Invalid JWT Token");
                    }
                } else {
                    // 헤더가 없거나 형식이 틀림
                    log.error("STOMP Authorization 헤더가 없음 또는 형식 불일치");
                    // 필요 시 에러를 던져서 연결 거부
                    // throw new RuntimeException("Authorization header is missing");
                }
            } catch (Exception e) {
                // 🚨 여기서 에러를 잡아서 로그를 찍어야 콘솔에 보입니다!
                log.error("STOMP 연결 중 에러 발생: {}", e.getMessage());
                e.printStackTrace(); // 상세 에러 스택 출력
                throw e; // 에러를 다시 던져서 클라이언트에게 에러 프레임 전송
            }
        }
        return message;
    }
}