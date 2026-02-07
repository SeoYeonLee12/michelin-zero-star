package com.michelin0.michelinzerostar.domain.recipescrap.domain.projection;

import com.michelin0.michelinzerostar.domain.recipe.domain.enums.RecipeType;
import java.util.Collections;
import java.util.List;

public record ScrapRecipeListProjection(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
        String nickName,
        RecipeType recipeType,
        List<String> tags
) {

    public ScrapRecipeListProjection(Long recipeId, String title, String mainImageUrl,
            Double averageRating, String nickName, RecipeType recipeType) {
        this(recipeId, title, mainImageUrl, averageRating, nickName, recipeType, Collections.emptyList());
    }

    public ScrapRecipeListProjection updateTags(List<String> newTags) {
        return new ScrapRecipeListProjection(
                recipeId, title, mainImageUrl, averageRating, nickName, recipeType, newTags
        );
    }
}
