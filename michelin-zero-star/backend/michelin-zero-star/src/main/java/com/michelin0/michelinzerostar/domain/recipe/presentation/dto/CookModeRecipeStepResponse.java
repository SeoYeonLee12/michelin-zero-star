package com.michelin0.michelinzerostar.domain.recipe.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.application.command.CookModeRecipeStepCommand;

public record CookModeRecipeStepResponse(
        Long recipeStepId,
        Integer stepNumber,
        String stepDescription,
        String stepImageUrl,
        Integer timerSeconds,
        String cookingTip

) {

    public static CookModeRecipeStepResponse from(CookModeRecipeStepCommand command) {
        return new CookModeRecipeStepResponse(
                command.recipeStepId(),
                command.stepNumber(),
                command.stepDescription(),
                command.stepImageUrl(),
                command.timerSeconds(),
                command.cookingTip()
        );
    }
}
