package com.michelin0.michelinzerostar.domain.recipe.application.result;

public record RecipeSaveResult(
        Long recipeId,
        boolean isAwardedRecipeRegisterReward
) {

}
