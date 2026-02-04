package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiCommonChatbotResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.UserAiChatResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.RedisChatService;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiChatCompletedEvent;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiResponseArrivedEvent;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatMessage;
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

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAiResponse(AiResponseArrivedEvent event) {
        log.info("이벤트 감지! 소켓 전송 시작");
        UserAiChatResponse response = UserAiChatResponse.from(event.aiChatMessage());
        String destination = "/topic/recipe/" + response.recipeId();
        simpMessagingTemplate.convertAndSend(destination, response);
        log.info("소켓 전송 완료: {}", destination);
    }

    @EventListener
    public void handleAiCommonChatComplete(AiChatCompletedEvent event) {
        log.info("Common Chat Event Received for User: {}", event.userId());
        AiCommonChatbotResponse response = AiCommonChatbotResponse.from(event.answer());
        String destination = "/topic/global/" + event.userId();

        simpMessagingTemplate.convertAndSend(destination, response);
        log.info("WebSocket Sent to: {}", destination);

        // TODO 레디스 저장 어플리케이션 서비스로 이동
        redisChatService.saveMessage(event.userId(), response);
        log.info("Redis Saved for User: {}", event.userId());
    }
}

