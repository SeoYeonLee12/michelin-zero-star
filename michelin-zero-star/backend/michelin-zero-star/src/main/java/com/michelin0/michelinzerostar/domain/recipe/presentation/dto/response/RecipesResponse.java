package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

public record RecipesResponse(
        String recipeId,
        String title,
        String mainImageUrl,
        Integer cookTime,
        Double averageRating,
        Integer servings,
        boolean isScrapped,
        String nickName
) {

}
