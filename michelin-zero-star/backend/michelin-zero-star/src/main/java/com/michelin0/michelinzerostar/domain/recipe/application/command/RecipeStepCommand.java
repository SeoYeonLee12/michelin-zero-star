package com.michelin0.michelinzerostar.domain.recipe.application.command;

public record RecipeStepCommand(
        Integer stepNumber,
        String stepDescription,
        Integer timerSeconds,
        String stepImageUrl,
        String cookingTip
) {

}
