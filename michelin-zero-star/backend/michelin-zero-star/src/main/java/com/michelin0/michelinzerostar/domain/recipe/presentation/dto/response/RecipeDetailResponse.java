package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record RecipeDetailResponse(
        String title,
        String mainImageUrl,
        String description,
        Integer cookTime,
        Integer servings,
        Integer scrapCount,
        Integer reviewCount,
        Double averageRating,
        String recipeType,
        List<RecipeNutritionResponse> nutrition,
        LocalDateTime createdAt,
        List<RecipeUserResponse> userInfo,
        List<String> categoryNames,
        List<RecipeTagResponse> tags,
        List<RecipeIngredientResponse> ingredients,
        List<RecipeStepResponse> steps

) {

}
