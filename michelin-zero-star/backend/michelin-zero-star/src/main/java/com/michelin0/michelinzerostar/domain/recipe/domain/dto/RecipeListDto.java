package com.michelin0.michelinzerostar.domain.recipe.domain.dto;

public record RecipeListDto(
        String title,
        String mainImageUrl,
        Integer cookTime,
        Integer servings,
        String nickname,
        Double averageRating

) {

}
