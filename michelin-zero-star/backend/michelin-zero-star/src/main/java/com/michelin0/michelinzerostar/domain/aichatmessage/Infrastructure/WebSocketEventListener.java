package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiToUserResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.UserAiChatResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.RedisChatService;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiChatCompletedEvent;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiResponseArrivedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessagingTemplate simpMessagingTemplate;
    private final RedisChatService redisChatService;

    @EventListener
    public void handleAiResponse(AiResponseArrivedEvent event) {
        log.info("이벤트 감지! 소켓 전송 시작");
        UserAiChatResponse response = UserAiChatResponse.from(event.aiChatMessage());
        String destination = "/topic/recipe/" + response.recipeId();
        simpMessagingTemplate.convertAndSend(destination, response);
        log.info("소켓 전송 완료: {}", destination);
    }

    @EventListener
    public void handleAiCommonChatComplete(AiChatCompletedEvent event) {
        log.info("응답 받는 유저 아이디: {}", event.userId());
        AiToUserResponse response = AiToUserResponse.from(event.answer());
        redisChatService.saveAiMessage(event.userId(), response);
        String destination = "/topic/global/" + event.userId();
        simpMessagingTemplate.convertAndSend(destination, response);
        log.info("전송 완료 !! 전송 경로: {}", destination);
    }
}

