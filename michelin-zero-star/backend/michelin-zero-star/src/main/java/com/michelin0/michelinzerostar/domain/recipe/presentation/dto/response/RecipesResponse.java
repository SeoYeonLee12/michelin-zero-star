package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeListCommand;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeListProjection;

public record RecipesResponse(
        Long recipeId,
        String title,
        String mainImageUrl,
        Integer cookTime,
        Double averageRating,
        Integer servings,
        boolean isScrapped,
        String nickName
) {

    public static RecipesResponse from(RecipeListCommand command) {
        return new RecipesResponse(
                command.recipeId(),
                command.title(),
                command.mainImageUrl(),
                command.cookTime(),
                command.averageRating(),
                command.servings(),
                command.isScrapped(),
                command.nickName()
        );
    }
}