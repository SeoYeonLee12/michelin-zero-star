package com.michelin0.michelinzerostar.domain.recipe.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.application.command.CookModeCommand;
import java.util.List;

public record CookModeDetailResponse(
        Long recipeId,
        String title,
        Integer totalStep,
        List<CookModeRecipeStepResponse> steps
) {

    public static CookModeDetailResponse from(CookModeCommand command) {
        return new CookModeDetailResponse(
                command.recipeId(),
                command.title(),
                command.totalStep(),
                command.steps().stream()
                        .map(CookModeRecipeStepResponse::from)
                        .toList()
        );
    }
}
