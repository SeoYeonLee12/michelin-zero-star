package com.michelin0.michelinzerostar.domain.recipe.domain.dto;

public record RecipeStepDto(
        Integer step_number,
        String step_description,
        Integer timer_seconds,
        String step_imageUrl,
        String cooking_tip
) {

}
