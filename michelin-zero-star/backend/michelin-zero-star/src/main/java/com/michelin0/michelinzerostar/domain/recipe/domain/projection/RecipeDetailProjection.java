package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

import java.time.LocalDateTime;
import java.util.List;

public record RecipeDetailProjection(
        Long recipeId,
        Long userId,
        String title,
        String mainImageUrl,
        String description,
        Integer cookTime,
        Integer servings,
        Integer scrapCount,
        Integer reviewCount,
        Double averageRating,
        String recipeType,
        Double calorie,
        Double carbohydrate,
        Double protein,
        Double saturatedFat,
        Double cholesterol,
        Double sodium,
        Double calcium,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String nickname,
        Boolean isScrapped,
        Boolean isMine,
        List<String> categoryNames,
        List<RecipeTagProjection> tags,
        List<RecipeIngredientProjection> ingredients,
        List<RecipeStepProjection> steps
) {

}