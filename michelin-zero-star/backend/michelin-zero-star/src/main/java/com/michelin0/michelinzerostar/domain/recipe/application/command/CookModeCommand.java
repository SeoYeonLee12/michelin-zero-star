package com.michelin0.michelinzerostar.domain.recipe.application.command;

import com.michelin0.michelinzerostar.domain.recipe.domain.projection.CookModeProjection;
import java.util.List;

public record CookModeCommand(
        Long recipeId,
        String title,
        Integer totalStep,
        List<CookModeRecipeStepCommand> steps
) {

    public static CookModeCommand from(CookModeProjection projection) {
        return new CookModeCommand(
                projection.recipeId(),
                projection.title(),
                projection.totalStep(),
                projection.steps().stream()
                        .map(CookModeRecipeStepCommand::from)
                        .toList()
        );
    }
}
