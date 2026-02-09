package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

public record RecipeTagGetListProjection(
        Long recipeId,
        String tagName
) {

}
