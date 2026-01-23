package com.michelin0.michelinzerostar.domain.recipe.domain.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RecipeDetailDto(
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
        List<RecipeTagDto> tags,
        List<RecipeIngredientDto> ingredients,
        List<RecipeStepDto> steps
) {

    public RecipeDetailDto updateRecipeDetail(Boolean newIsMine, Boolean newIsScrapped) {
        return new RecipeDetailDto(
                recipeId,
                userId,
                title,
                mainImageUrl,
                description,
                cookTime,
                servings,
                scrapCount,
                reviewCount,
                averageRating,
                recipeType,
                calorie,
                carbohydrate,
                protein,
                saturatedFat,
                cholesterol,
                sodium,
                calcium,
                createdAt,
                updatedAt,
                nickname,
                newIsScrapped,
                newIsMine,
                categoryNames,
                tags,
                ingredients,
                steps
        );
    }
}