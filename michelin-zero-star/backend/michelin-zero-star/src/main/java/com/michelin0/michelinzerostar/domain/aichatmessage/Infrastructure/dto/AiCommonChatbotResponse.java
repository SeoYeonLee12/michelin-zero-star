package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import com.michelin0.michelinzerostar.domain.aichatmessage.domain.CommonAiAnswer;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.enums.SenderType;
import java.time.LocalDateTime;
import java.util.List;

public record AiCommonChatbotResponse(
        String answer,
        List<RecommendedRecipeResponse> recommended_recipes
) {

    public CommonAiAnswer toCommonAiAnswer() {
        return new CommonAiAnswer(
                answer,
                recommended_recipes.stream()
                        .map(RecommendedRecipeResponse::toDomain)
                        .toList(),
                SenderType.AI.toString(),
                LocalDateTime.now()
        );
    }
}
