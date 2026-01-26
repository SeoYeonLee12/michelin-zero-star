package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

public record RecipeListDto(
        String title,
        String mainImageUrl,
        Integer cookTime,
        Integer servings,
        String nickname,
        Double averageRating

) {

}
