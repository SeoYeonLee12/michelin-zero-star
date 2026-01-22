package com.michelin0.michelinzerostar.domain.recipe.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeIngredientRegisterCommand;
import jakarta.validation.constraints.NotBlank;

public record RecipeIngredientRegisterRequest(
        @NotBlank(message = "재료 양을 입력하세요.")
        String ingredientName,
        @NotBlank(message = "재료 명을 입력하세요.")
        String ingredientAmount
) {

    public RecipeIngredientRegisterCommand toCommand() {
        return new RecipeIngredientRegisterCommand(this.ingredientName, this.ingredientAmount);
    }

}
