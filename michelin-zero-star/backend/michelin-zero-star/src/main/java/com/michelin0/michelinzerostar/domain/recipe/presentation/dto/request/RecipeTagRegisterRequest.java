package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.request;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeTagRegisterCommand;
import jakarta.validation.constraints.NotBlank;

public record RecipeTagRegisterRequest(
        @NotBlank(message = "태그를 입력하세요.")
        String tagName
) {

    public RecipeTagRegisterCommand toCommand() {
        return new RecipeTagRegisterCommand(tagName);
    }
}
