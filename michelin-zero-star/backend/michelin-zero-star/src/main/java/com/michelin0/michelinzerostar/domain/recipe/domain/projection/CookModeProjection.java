package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

import java.util.List;

public record CookModeProjection(
        Long recipeId,
        String title,
        Integer totalStep,
        List<CookModeRecipeStepProjection> steps
) {

}