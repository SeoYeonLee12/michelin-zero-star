package com.michelin0.michelinzerostar.domain.recipe.application.command;

import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeListProjection;

public record RecipeListCommand(
        Long recipeId,
        String title,
        String mainImageUrl,
        Integer cookTime,
        Double averageRating,
        Integer servings,
        boolean isScrapped,
        String nickName
) {


    public static RecipeListCommand from(RecipeListProjection projection) {
        return new RecipeListCommand(
                projection.recipeId(),
                projection.title(),
                projection.mainImageUrl(),
                projection.cookTime(),
                projection.averageRating(),
                projection.servings(),
                projection.isScrapped(),
                projection.nickName()
        );
    }
}
