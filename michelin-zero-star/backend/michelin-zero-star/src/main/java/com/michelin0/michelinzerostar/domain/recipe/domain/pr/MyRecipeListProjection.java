package com.michelin0.michelinzerostar.domain.recipe.domain.pr;

import java.util.Collections;
import java.util.List;

public record MyRecipeListProjection(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
        String nickName,
        List<String> tags
) {

    public MyRecipeListProjection(Long recipeId, String title, String mainImageUrl,
            Double averageRating, String nickName) {
        this(recipeId, title, mainImageUrl, averageRating, nickName, Collections.emptyList());
    }

    public MyRecipeListProjection updateTags(List<String> newTags) {
        return new MyRecipeListProjection(
                recipeId, title, mainImageUrl, averageRating, nickName, newTags
        );
    }
}
