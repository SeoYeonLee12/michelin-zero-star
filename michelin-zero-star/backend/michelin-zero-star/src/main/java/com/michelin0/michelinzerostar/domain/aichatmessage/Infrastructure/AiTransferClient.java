package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiRecipeChatbotResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.UserRecipeChatbotRequest;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// 레스트 클라이언트 쓸거임(단순 AI 엔드포인트로 데이터 전송 작업만 할거임)
@Component
@RequiredArgsConstructor
public class AiTransferClient {

    private final RestClient aiRestClient;

    public AiRecipeChatbotResponse transferData(
            User user,
            String content,
            Integer currentStepNumber,
            List<RecipeStep> steps
    ) {
        UserRecipeChatbotRequest request = UserRecipeChatbotRequest.of(
                user,
                content,
                currentStepNumber,
                steps
        );

        return aiRestClient.post()
                .uri("/api/chat/qna")
                .body(request)
                .retrieve()
                .body(AiRecipeChatbotResponse.class);
    }
}
