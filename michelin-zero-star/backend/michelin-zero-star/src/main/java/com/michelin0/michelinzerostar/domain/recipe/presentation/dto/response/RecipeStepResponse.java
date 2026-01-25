package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeStepCommand;

public record RecipeStepResponse(
        Integer step_number,
        String step_description,
        Integer timer_seconds,
        String step_imageUrl,
        String cooking_tip
) {

    public static RecipeStepResponse from(RecipeStepCommand command) {
        return new RecipeStepResponse(
                command.stepNumber(),
                command.stepDescription(),
                command.timerSeconds(),
                command.stepImageUrl(),
                command.cookingTip()
        );
    }
}
