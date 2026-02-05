package com.michelin0.michelinzerostar.domain.recipescrap.domain.projection;

import java.util.Collections;
import java.util.List;

public record ScrapRecipeListProjection(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
        String nickName,
        List<String> tags
) {

    public ScrapRecipeListProjection(Long recipeId, String title, String mainImageUrl,
            Double averageRating, String nickName) {
        this(recipeId, title, mainImageUrl, averageRating, nickName, Collections.emptyList());
    }

    public ScrapRecipeListProjection updateTags(List<String> newTags) {
        return new ScrapRecipeListProjection(
                recipeId, title, mainImageUrl, averageRating, nickName, newTags
        );
    }
}
