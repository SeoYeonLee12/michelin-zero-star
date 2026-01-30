package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

import java.util.Collections;
import java.util.List;

public record RecipeListProjection(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
        Boolean isScrapped,
        String nickName,
        Boolean isMine,
        List<String> tags
) {

    public RecipeListProjection(Long recipeId, String title, String mainImageUrl,
            Double averageRating, Boolean isScrapped, String nickName,
            Boolean isMine) {
        this(recipeId, title, mainImageUrl, averageRating, isScrapped, nickName,
                isMine, Collections.emptyList());
    }

    public RecipeListProjection updateTags(List<String> newTags) {
        return new RecipeListProjection(
                recipeId,
                title,
                mainImageUrl,
                averageRating,
                isScrapped,
                nickName,
                isMine,
                newTags
        );
    }

}
