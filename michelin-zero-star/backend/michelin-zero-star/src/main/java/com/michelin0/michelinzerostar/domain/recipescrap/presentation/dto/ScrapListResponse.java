package com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.RecipeTagResponse;
import com.michelin0.michelinzerostar.domain.recipescrap.application.result.UserRecipeScrapResult;
import java.util.List;

public record ScrapListResponse(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
        String nickName,
        List<RecipeTagResponse> tags
) {

    public static ScrapListResponse from(UserRecipeScrapResult result) {
        return new ScrapListResponse(
                result.recipeId(),
                result.title(),
                result.mainImageUrl(),
                result.averageRating(),
                result.nickName(),
                result.tags().stream().map(RecipeTagResponse::from).toList()
        );
    }
}
