package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

public record RecipeListProjection(
        Long recipeId,
        String title,
        String mainImageUrl,
        Integer cookTime,
        Double averageRating,
        Integer servings,
        boolean isScrapped,
        String nickName
) {

}
