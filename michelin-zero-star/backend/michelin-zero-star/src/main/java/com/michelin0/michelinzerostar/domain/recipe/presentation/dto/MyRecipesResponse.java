package com.michelin0.michelinzerostar.domain.recipe.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.application.result.MyRecipeListResult;
import java.util.List;

public record MyRecipesResponse(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
        String nickName,
        List<String> tags
) {

    public static MyRecipesResponse from(MyRecipeListResult result) {
        return new MyRecipesResponse(
                result.recipeId(),
                result.title(),
                result.mainImageUrl(),
                result.averageRating(),
                result.nickName(),
                result.tags()
        );
    }
}
