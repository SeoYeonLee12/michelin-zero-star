package com.michelin0.michelinzerostar.domain.recipe.application.command;

import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeStepProjection;

public record RecipeStepCommand(
        Integer stepNumber,
        String stepDescription,
        Integer timerSeconds,
        String stepImageUrl,
        String cookingTip
) {

    public static RecipeStepCommand from(RecipeStepProjection projection) {
        return new RecipeStepCommand(
                projection.step_number(),
                projection.step_description(),
                projection.timer_seconds(),
                projection.step_image_url(),
                projection.cooking_tip()
        );
    }


}
