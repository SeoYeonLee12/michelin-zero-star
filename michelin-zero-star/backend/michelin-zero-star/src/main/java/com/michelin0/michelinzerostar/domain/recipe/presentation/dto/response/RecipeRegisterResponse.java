package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.result.RecipeSaveResult;

public record RecipeRegisterResponse(
        Long recipeId,
        boolean isAwardedRecipeRegisterReward
) {

    public static RecipeRegisterResponse from(RecipeSaveResult result) {
        return new RecipeRegisterResponse(
                result.recipeId(),
                result.isAwardedRecipeRegisterReward()
        );
    }
}
