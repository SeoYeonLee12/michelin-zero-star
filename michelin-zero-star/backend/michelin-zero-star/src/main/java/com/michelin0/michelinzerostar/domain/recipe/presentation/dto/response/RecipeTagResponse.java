package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeTagCommand;

public record RecipeTagResponse(
        String tag_name
) {

    public static RecipeTagResponse from(RecipeTagCommand command) {
        return new RecipeTagResponse(command.tagName());
    }

}
