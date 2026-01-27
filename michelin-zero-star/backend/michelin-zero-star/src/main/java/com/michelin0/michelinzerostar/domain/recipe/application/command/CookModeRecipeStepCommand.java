package com.michelin0.michelinzerostar.domain.recipe.application.command;

import com.michelin0.michelinzerostar.domain.recipe.domain.projection.CookModeRecipeStepProjection;

public record CookModeRecipeStepCommand(
        Long recipeStepId,
        Integer stepNumber,
        String stepDescription,
        String stepImageUrl,
        Integer timerSeconds,
        String cookingTip
) {

    public static CookModeRecipeStepCommand from(CookModeRecipeStepProjection projection) {
        return new CookModeRecipeStepCommand(
                projection.recipeStepId(),
                projection.stepNumber(),
                projection.stepDescription(),
                projection.stepImageUrl(),
                projection.timerSeconds(),
                projection.cookingTip()
        );
    }
}
