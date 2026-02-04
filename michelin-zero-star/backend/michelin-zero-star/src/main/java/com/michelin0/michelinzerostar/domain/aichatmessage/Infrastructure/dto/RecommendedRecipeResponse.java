package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiRecipeRecommendation;
import java.util.List;

public record RecommendedRecipeResponse(
        Long recipes_id,
        String title,
        String main_image_url,
        Integer cook_time,
        Double calories,
        List<String> tags
) {
    public AiRecipeRecommendation toDomain() {
        return new AiRecipeRecommendation(
                this.recipes_id,
                this.title,
                this.main_image_url,
                this.cook_time,
                this.calories,
                this.tags
        );
    }

    public static RecommendedRecipeResponse from(AiRecipeRecommendation vo) {
        return new RecommendedRecipeResponse(
                vo.recipeId(),
                vo.title(),
                vo.mainImageUrl(),
                vo.cookTime(),
                vo.calories(),
                vo.tags()
        );
    }
}
