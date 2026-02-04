package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import com.michelin0.michelinzerostar.domain.aichatmessage.domain.CommonAiAnswer;
import java.util.List;

public record AiCommonChatbotResponse(
        String answer,
        List<RecommendedRecipeResponse> recommended_recipes
) {
    public CommonAiAnswer toDomain() {
        return new CommonAiAnswer(
                answer,
                recommended_recipes.stream()
                        .map(RecommendedRecipeResponse::toDomain)
                        .toList()
        );
    }

    public static AiCommonChatbotResponse from(CommonAiAnswer commonAiAnswer){
        return new AiCommonChatbotResponse(
                commonAiAnswer.content(),
                commonAiAnswer.recommendations().stream()
                        .map(RecommendedRecipeResponse::from)
                        .toList()
        );
    }
}
