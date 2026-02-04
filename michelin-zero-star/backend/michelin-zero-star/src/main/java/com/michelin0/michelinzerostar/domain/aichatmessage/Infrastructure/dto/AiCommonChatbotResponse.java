package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import java.util.List;

public record AiCommonChatbotResponse(
        String answer,
        List<RecommendedRecipeResponse> recommended_recipes
) {

}
