package com.michelin0.michelinzerostar.domain.recipe.application.command;

import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeDetailProjection;
import java.time.LocalDateTime;
import java.util.List;

public record RecipeDetailCommand(
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
        List<RecipeTagCommand> tags,
        List<RecipeIngredientCommand> ingredients,
        List<RecipeStepCommand> steps
) {


    public static RecipeDetailCommand from(RecipeDetailProjection projection) {
        return new RecipeDetailCommand(
                projection.recipeId(),
                projection.userId(),
                projection.title(),
                projection.mainImageUrl(),
                projection.description(),
                projection.cookTime(),
                projection.servings(),
                projection.scrapCount(),
                projection.reviewCount(),
                projection.averageRating(),
                projection.recipeType(),
                projection.calorie(),
                projection.carbohydrate(),
                projection.protein(),
                projection.saturatedFat(),
                projection.cholesterol(),
                projection.sodium(),
                projection.calcium(),
                projection.createdAt(),
                projection.updatedAt(),
                projection.nickname(),
                projection.isScrapped(),
                projection.isMine(),
                projection.categoryNames(),
                projection.tags().stream()
                        .map(RecipeTagCommand::from)
                        .toList(),
                projection.ingredients().stream()
                        .map(RecipeIngredientCommand::from)
                        .toList(),
                projection.steps().stream()
                        .map(RecipeStepCommand::from)
                        .toList()
        );
    }
}
