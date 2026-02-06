package com.michelin0.michelinzerostar.domain.recipereview.application.command;

import com.michelin0.michelinzerostar.domain.recipereview.presentation.dto.RecipeReviewModifyRequest;

public record RecipeReviewModifyCommand(
        String content,
        Double rating
) {

    public static RecipeReviewModifyCommand from(RecipeReviewModifyRequest request) {
        return new RecipeReviewModifyCommand(request.content(), request.rating());
    }
}
