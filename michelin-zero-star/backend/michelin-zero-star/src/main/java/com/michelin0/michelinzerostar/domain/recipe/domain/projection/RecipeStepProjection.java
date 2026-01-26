package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

public record RecipeStepProjection(
        Integer step_number,
        String step_description,
        Integer timer_seconds,
        String step_image_url,
        String cooking_tip
) {

}
