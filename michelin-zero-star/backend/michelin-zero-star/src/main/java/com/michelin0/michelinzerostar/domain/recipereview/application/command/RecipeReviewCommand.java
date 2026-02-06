package com.michelin0.michelinzerostar.domain.recipereview.application.command;

public record RecipeReviewCommand(
        Long userId,
        Long recipeId,
        String content,
        Double rating
) {

}
