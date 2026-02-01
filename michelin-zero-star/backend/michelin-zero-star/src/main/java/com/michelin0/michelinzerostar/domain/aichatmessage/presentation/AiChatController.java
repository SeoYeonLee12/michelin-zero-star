package com.michelin0.michelinzerostar.domain.aichatmessage.presentation;

import com.michelin0.michelinzerostar.domain.aichatmessage.application.ChatRedisService;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class AiChatController {

    private final SimpMessagingTemplate messageTemplate;
    private final ChatRedisService chatRedisService;

    @MessageMapping("/hello")
    public void greeting(ChatMessage message) {
        chatRedisService.saveMessage("default-room", message);

        // 구독하는 클라이언트에게 발행
        ChatMessage response = new ChatMessage("서버가 보냅니다", "반가워요, " + message.getSender());
        chatRedisService.saveMessage("default-room-server", response);
        
        messageTemplate.convertAndSend("/topic/greetings", response);
        log.info("발송완료");
    }
}
