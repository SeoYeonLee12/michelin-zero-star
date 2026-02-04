package com.michelin0.michelinzerostar.domain.aichatmessage.presentation;

import com.michelin0.michelinzerostar.domain.aichatmessage.application.AiChatMessageService;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.RedisChatService;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.command.RecipeChatbotCommand;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.result.ChatHistoryResult;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatMessage;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatSaveMessageRequest;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.CommonChatMassageRequest;
import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
@Slf4j
public class AiChatController {

    private final SimpMessagingTemplate messageTemplate;
    private final RedisChatService redisChataService;
    private final AiChatMessageService aiChatMessageService;
    private final JwtTokenProvider jwtTokenProvider;

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
            @Payload @Valid ChatSaveMessageRequest request,
            @Header("Authorization") String token
    ) {
        String resolvedToken = extractToken(token);
        UserPrincipal user = getUserFromToken(resolvedToken);
        RecipeChatbotCommand command = new RecipeChatbotCommand(
                user.getId(),
                request.recipeId(),
                request.content(),
                request.currentStepNumber()
        );
        aiChatMessageService.askRecipe(command);
    }

    @GetMapping("/api/recipes/{recipeId}/chat")
    public ResponseEntity<AIChatListResponse> getChatHistoryList(
            @PathVariable Long recipeId,
            @RequestParam(required = false) Long lastMessageId,
            @RequestParam(defaultValue = "20") int pageSize,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<ChatHistoryResult> result = aiChatMessageService.getChatHistory(
                userPrincipal.getId(), recipeId, lastMessageId, pageSize);
        boolean hasNext = false;
        if (result.size() > pageSize) {
            hasNext = true;
            result.remove(pageSize);
        }
        Long nextCursorId =
                result.isEmpty() ? null : result.get(result.size() - 1).getAiChatMessageId();

        List<AiChatHistoryResponse> response = result.stream()
                .map(AiChatHistoryResponse::from)
                .toList();
        return ResponseEntity.status(HttpStatus.OK)
                .body(AIChatListResponse.of(response, nextCursorId, hasNext));
    }

    @MessageMapping("/common/ask")
    public void askCommonMessage(
            @Payload @Valid CommonChatMassageRequest request,
            @Header("Authorization") String token
    ) {
        String resolvedToken = extractToken(token);
        UserPrincipal user = getUserFromToken(resolvedToken);

    }


    private String extractToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return token;
    }

    private UserPrincipal getUserFromToken(String token) {
        try {
            Authentication authentication = jwtTokenProvider.getAuthentication(token);
            return (UserPrincipal) authentication.getPrincipal();
        } catch (Exception e) {
            log.error("토큰 인증 실패: {}", e.getMessage());
            throw new RuntimeException("인증 정보가 유효하지 않습니다.");
        }
    }
}
