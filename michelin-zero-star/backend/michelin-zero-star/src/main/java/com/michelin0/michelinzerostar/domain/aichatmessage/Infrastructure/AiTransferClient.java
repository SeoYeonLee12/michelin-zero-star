package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiCommonChatbotRequest;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiCommonChatbotResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiRecipeChatbotRequest;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiRecipeChatbotResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.CommonAiAnswer;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.exception.errorcode.AiChatMessageErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// 레스트 클라이언트 쓸거임(단순 AI 엔드포인트로 데이터 전송 작업만 할거임)
@Component
@RequiredArgsConstructor
@Slf4j
public class AiTransferClient {

    private final RestClient aiRestClient;

    public AiRecipeChatbotResponse transferData(
            User user,
            String content,
            Integer currentStepNumber,
            List<RecipeStep> steps
    ) {
        AiRecipeChatbotRequest request = AiRecipeChatbotRequest.of(
                user,
                content,
                currentStepNumber,
                steps
        );
        log.info("Complete Transfer");
        return aiRestClient.post()
                .uri("/api/chat/qna")
                .body(request)
                .retrieve()
                .body(AiRecipeChatbotResponse.class);
    }

    public CommonAiAnswer transferData(
            User user,
            String content,
            List<String> favoriteCategories
    ) {
        AiCommonChatbotRequest request = AiCommonChatbotRequest.of(
                user,
                content,
                favoriteCategories
        );
        log.info("Sending request to AI Server: {}", request);

        AiCommonChatbotResponse response = aiRestClient.post()
                .uri("/api/chat/search")
                .body(request)
                .retrieve()
                .body(AiCommonChatbotResponse.class);
        if (response == null) {
            throw new GlobalException(AiChatMessageErrorCode.EMPTY_AI_CLIENT_REPSONSE);
        }
        return response.toDomain();
    }
}
