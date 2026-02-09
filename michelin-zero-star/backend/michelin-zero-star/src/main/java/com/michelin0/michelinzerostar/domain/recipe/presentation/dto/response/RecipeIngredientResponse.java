package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeIngredientCommand;

public record RecipeIngredientResponse(
        String ingredient_name,
        String ingredient_amount
) {

    public static RecipeIngredientResponse from(RecipeIngredientCommand command) {
        return new RecipeIngredientResponse(command.ingredientName(), command.ingredientAmount());
    }

}
