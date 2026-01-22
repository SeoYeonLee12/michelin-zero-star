package com.michelin0.michelinzerostar.domain.recipe.application.command;

public record RecipeIngredientRegisterCommand(
        String ingredientName,
        String ingredientAmount
) {

}
