package com.michelin0.michelinzerostar.domain.recipescrap.application.result;

import com.michelin0.michelinzerostar.domain.recipe.domain.enums.RecipeType;
import com.michelin0.michelinzerostar.domain.recipescrap.domain.projection.ScrapRecipeListProjection;
import java.util.List;

public record UserRecipeScrapResult(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
        String nickName,
        RecipeType recipeType,
        List<String> tags
) {

    public static UserRecipeScrapResult from(ScrapRecipeListProjection projection) {
        return new UserRecipeScrapResult(
                projection.recipeId(),
                projection.title(),
                projection.mainImageUrl(),
                projection.averageRating(),
                projection.nickName(),
                projection.recipeType(),
                projection.tags()
        );
    }
}
