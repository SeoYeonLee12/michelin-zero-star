package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeDetailCommand;
import java.time.LocalDateTime;
import java.util.List;

public record RecipeDetailResponse(
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
        String userProfileImageUrl,
        Double userTotalStar,
        Boolean isScrapped,
        Boolean isMine,
        List<String> categoryNames,
        List<RecipeTagResponse> tags,
        List<RecipeIngredientResponse> ingredients,
        List<RecipeStepResponse> steps

) {

    public static RecipeDetailResponse from(RecipeDetailCommand command) {
        return new RecipeDetailResponse(
                command.recipeId(),
                command.userId(),
                command.title(),
                command.mainImageUrl(),
                command.description(),
                command.cookTime(),
                command.servings(),
                command.scrapCount(),
                command.reviewCount(),
                command.averageRating(),
                command.recipeType(),
                command.calorie(),
                command.carbohydrate(),
                command.protein(),
                command.saturatedFat(),
                command.cholesterol(),
                command.sodium(),
                command.calcium(),
                command.createdAt(),
                command.updatedAt(),
                command.nickname(),
                command.userProfileImageUrl(),
                command.userTotalStar(),
                command.isScrapped(),
                command.isMine(),
                command.categoryNames(),
                command.tags().stream()
                        .map(RecipeTagResponse::from)
                        .toList(),
                command.ingredients().stream()
                        .map(RecipeIngredientResponse::from)
                        .toList(),
                command.steps().stream()
                        .map(RecipeStepResponse::from)
                        .toList()
        );

    }
}
