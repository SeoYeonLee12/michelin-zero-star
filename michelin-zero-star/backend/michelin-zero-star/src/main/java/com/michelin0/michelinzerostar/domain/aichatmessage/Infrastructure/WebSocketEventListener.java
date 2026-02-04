package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.UserAiChatResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiResponseArrivedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessagingTemplate simpMessagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAiResponse(AiResponseArrivedEvent event) {
        log.info("이벤트 감지! 소켓 전송 시작");
        UserAiChatResponse response = UserAiChatResponse.from(event.aiChatMessage());
        String destination = "/topic/recipe/" + response.recipeId();
        simpMessagingTemplate.convertAndSend(destination, response);
        log.info("소켓 전송 완료: {}", destination);
    }
}
