package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeListCommand;
import java.util.List;

public record RecipesResponse(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
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
                command.averageRating(),
                command.isScrapped(),
                command.nickName(),
                command.isMine(),
                command.tags().stream()
                        .map(RecipeTagResponse::new)
                        .toList()
        );
    }
}