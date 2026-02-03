package com.michelin0.michelinzerostar.global.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@RequiredArgsConstructor
@EnableWebSocketMessageBroker
@EnableWebSocket
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String END_POINT = "/ws/connect";
    private static final String SIMPLE_BROKER_TOPIC = "/topic";
    private static final String SIMPLE_BROKER_QUEUE = "/queue";
    private static final String PUBLISH = "/app";

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes(PUBLISH);
        registry.enableSimpleBroker(SIMPLE_BROKER_TOPIC, SIMPLE_BROKER_QUEUE);
        // 클라이언트가 보낸 메시지를 어떤 핸들러 메서드로 전달해야하는지 지정(-@MessageMapping)
        // >> 클라이언트가 "/user로 시작하는 경로로 요청을 보내면 컨트롤러로 전달됨.
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 웹소켓 연결 요청 경로
        registry.addEndpoint(END_POINT)
                .setAllowedOriginPatterns("*");
//                .withSockJS();
    }
}