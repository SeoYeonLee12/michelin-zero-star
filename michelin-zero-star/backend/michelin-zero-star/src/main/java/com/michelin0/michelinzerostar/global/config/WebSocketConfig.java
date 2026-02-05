package com.michelin0.michelinzerostar.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.michelin0.michelinzerostar.global.security.jwt.StompHandler;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.converter.DefaultContentTypeResolver;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@RequiredArgsConstructor
@EnableWebSocketMessageBroker
@EnableWebSocket
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // TODO 이거 String Utility로 이동 예정 기능 완성 후 리팩토링
    private static final String END_POINT = "/ws-stompt";
    private static final String SIMPLE_BROKER_TOPIC = "/topic";
    private static final String SIMPLE_BROKER_QUEUE = "/queue";
    private static final String PUBLISH = "/app";
    private final StompHandler stompHandler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes(PUBLISH, "/pub");
        registry.enableSimpleBroker(SIMPLE_BROKER_TOPIC, SIMPLE_BROKER_QUEUE, "/sub");
        // 클라이언트가 보낸 메시지를 어떤 핸들러 메서드로 전달해야하는지 지정(-@MessageMapping)
        // >> 클라이언트가 "/user로 시작하는 경로로 요청을 보내면 컨트롤러로 전달됨.
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 웹소켓 연결 요청 경로
        registry.addEndpoint(END_POINT)
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // 소켓 연결 시 JWT 토큰 검증 인터셉터 등록
        registration.interceptors(stompHandler);
    }

    @Override
    public boolean configureMessageConverters(List<MessageConverter> messageConverters) {
        DefaultContentTypeResolver resolver = new DefaultContentTypeResolver();
        resolver.setDefaultMimeType(MimeTypeUtils.APPLICATION_JSON);

        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setContentTypeResolver(resolver);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // 날짜 포맷 설정

        converter.setObjectMapper(objectMapper);
        messageConverters.add(converter);
        return false;
    }

}
