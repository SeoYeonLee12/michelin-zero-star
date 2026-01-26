package com.michelin0.michelinzerostar.domain.recipe.application.command;

import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeIngredientProjection;

public record RecipeIngredientCommand(
        String ingredientName,
        String ingredientAmount
) {

    public static RecipeIngredientCommand from(RecipeIngredientProjection projection) {
        return new RecipeIngredientCommand(
                projection.ingredient_name(),
                projection.ingredient_amount()
        );
    }

}
