package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeListCommand;
import java.util.List;

public record RecipesResponse(
        Long recipeId,
        String title,
        String mainImageUrl,
        Integer cookTime,
        Double averageRating,
        Integer servings,
        boolean isScrapped,
        String nickName,
        boolean isMine,
        List<RecipeTagResponse> tags
) {

    public static RecipesResponse from(RecipeListCommand command) {
        return new RecipesResponse(
                command.recipeId(),
                command.title(),
                command.mainImageUrl(),
                command.cookTime(),
                command.averageRating(),
                command.servings(),
                command.isScrapped(),
                command.nickName(),
                command.isMine(),
                command.tags().stream()
                        .map(RecipeTagResponse::new)
                        .toList()
        );
    }
}