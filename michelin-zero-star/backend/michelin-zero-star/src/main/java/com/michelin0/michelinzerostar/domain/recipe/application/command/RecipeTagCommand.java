package com.michelin0.michelinzerostar.domain.recipe.application.command;

import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeTagProjection;

public record RecipeTagCommand(
        String tagName
) {

    public static RecipeTagCommand from(RecipeTagProjection projection) {
        return new RecipeTagCommand(projection.tag_name());
    }
}
