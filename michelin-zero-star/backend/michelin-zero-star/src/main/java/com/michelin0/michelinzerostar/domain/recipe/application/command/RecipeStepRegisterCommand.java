package com.michelin0.michelinzerostar.domain.recipe.application.command;

public record RecipeStepRegisterCommand(
        Integer stepNumber,
        String stepDescription,
        Integer timerSeconds,
        String stepImageUrl,
        String cookingTip
) {

}
