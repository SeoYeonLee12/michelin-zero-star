package com.michelin0.michelinzerostar.domain.aichatmessage.presentation;

import com.michelin0.michelinzerostar.domain.aichatmessage.application.AiChatMessageService;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.RedisChataService;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.command.RecipeChatbotCommand;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatMessage;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatSaveMessageRequest;
import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    /**
     * 컨트롤러 수신
     * <p>
     * [동기] DB에 User Message 저장 (빠름, 0.01초) -> 데이터 유실 방지
     * <p>
     * [비동기 @Async] AI 서버로 요청 날리기 (느림, 3~10초) -> DB 저장 후 즉시 실행
     * <p>
     * 클라이언트에게는 "전송됨" 응답 (이미 끝남)
     * <p>
     * 나중에 AI 응답 오면 -> DB에 AI Message 저장 & 소켓 발송
     */
    @MessageMapping("/recipes/ask")
    public void saveUserMessage(
            @Payload ChatSaveMessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        RecipeChatbotCommand command = new RecipeChatbotCommand(
                principal.getId(),
                request.recipeId(),
                request.content(),
                request.currentStepNumber()
        );
        aiChatMessageService.askRecipe(command);
    }
}
