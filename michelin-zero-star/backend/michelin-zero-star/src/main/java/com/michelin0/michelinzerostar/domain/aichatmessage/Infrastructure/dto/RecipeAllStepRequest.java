package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record RecipeAllStepRequest(
        @NotNull(message = "단계 번호가 비어있습니다.")
        Integer step_number,
        @NotEmpty(message = "단계 설명이 비어있습니다.")
        String description
) {

    public static RecipeAllStepRequest from(RecipeStep step) {
        return new RecipeAllStepRequest(step.getStepNumber(), step.getStepDescription());
    }
}
