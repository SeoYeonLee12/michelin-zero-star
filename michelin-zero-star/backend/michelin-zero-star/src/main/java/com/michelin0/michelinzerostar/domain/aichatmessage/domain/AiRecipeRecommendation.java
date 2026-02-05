package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import java.util.List;

public record AiRecipeRecommendation(
        Long recipeId,
        String title,
        String mainImageUrl,
        Integer cookTime,
        Double calories,
        List<String> tags
) {
}