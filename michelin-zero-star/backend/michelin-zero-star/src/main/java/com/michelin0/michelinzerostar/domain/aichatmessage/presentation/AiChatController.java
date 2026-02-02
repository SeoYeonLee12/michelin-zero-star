package com.michelin0.michelinzerostar.domain.aichatmessage.presentation;

import com.michelin0.michelinzerostar.domain.aichatmessage.application.AiChatMessageService;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.RedisChataService;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.command.RecipeChatbotCommand;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatMessage;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatSaveMessageRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class AiChatController {

    private final SimpMessagingTemplate messageTemplate;
    private final RedisChataService redisChataService;
    private final AiChatMessageService aiChatMessageService;

    @MessageMapping("/hello")
    public void greeting(ChatMessage message) {
        redisChataService.saveMessage("default-room", message);

        // 구독하는 클라이언트에게 발행
        ChatMessage response = new ChatMessage("서버가 보냅니다", "반가워요, " + message.getSender());
        redisChataService.saveMessage("default-room-server", response);

        messageTemplate.convertAndSend("/topic/greetings", response);
        log.info("발송완료");
    }

    @MessageMapping("/recipes/ask")
    public void saveUserMessage(
            @Payload ChatSaveMessageRequest request
//            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long currentUserId = 2L;
        RecipeChatbotCommand command = new RecipeChatbotCommand(
                currentUserId,
                request.recipeId(),
                request.content(),
                request.currentStepNumber()
        );
        aiChatMessageService.askRecipe(command);
    }
}
