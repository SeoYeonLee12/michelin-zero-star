package com.michelin0.michelinzerostar.domain.recipereview.application.command;

import com.michelin0.michelinzerostar.domain.recipereview.presentation.dto.RecipeReviewSaveRequest;

public record RecipeReviewCommand(
        Long userId,
        Long recipeId,
        String content,
        Double rating
) {

    public static RecipeReviewCommand of(Long userId, RecipeReviewSaveRequest request) {
        return new RecipeReviewCommand(
                userId,
                request.recipeId(),
                request.content(),
                request.rating()
        );
    }
}
