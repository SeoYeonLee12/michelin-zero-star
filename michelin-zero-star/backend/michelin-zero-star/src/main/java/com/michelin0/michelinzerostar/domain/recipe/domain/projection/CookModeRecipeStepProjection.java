package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

public record CookModeRecipeStepProjection(
        Long recipeStepId,
        Integer stepNumber,
        String stepDescription,
        String stepImageUrl,
        Integer timerSeconds,
        String cookingTip
) {

}
