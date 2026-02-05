package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import com.michelin0.michelinzerostar.domain.aichatmessage.domain.CommonAiAnswer;
import java.time.LocalDateTime;
import java.util.List;

public record AiToUserResponse(
        String content,
        List<RecommendedRecipeResponse> recommendedRecipes,
        String senderType,
        LocalDateTime sendDate
) {

    public static AiToUserResponse from(CommonAiAnswer commonAiAnswer) {
        return new AiToUserResponse(
                commonAiAnswer.content(),
                commonAiAnswer.recommendations().stream()
                        .map(RecommendedRecipeResponse::from)
                        .toList(),
                commonAiAnswer.senderType(),
                commonAiAnswer.sendDateTime()
        );
    }
}
