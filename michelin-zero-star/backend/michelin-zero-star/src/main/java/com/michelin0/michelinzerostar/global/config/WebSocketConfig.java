package com.michelin0.michelinzerostar.global.config;

import com.michelin0.michelinzerostar.global.security.jwt.StompHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompHandler stompHandler;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // [연결 URL] ws://localhost:8080/ws-stomp
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*"); // 모든 출처 허용 (CORS)
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // [구독 경로] 클라이언트가 메시지를 받을 경로 (prefix)
        registry.enableSimpleBroker("/sub");

        // [발행 경로] 클라이언트가 서버로 메시지를 보낼 경로 (prefix)
        registry.setApplicationDestinationPrefixes("/pub");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // 소켓 연결 시 JWT 토큰 검증 인터셉터 등록
        registration.interceptors(stompHandler);
    }
}