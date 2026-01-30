package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

import java.util.Collections;
import java.util.List;

public record RecipeListProjection(
        Long recipeId,
        String title,
        String mainImageUrl,
        Integer cookTime, // 빼기
        Double averageRating,
        Integer servings, // 빼기
        Boolean isScrapped,
        String nickName,
        // 위 두 컬럼은 바뀔 컬럼
        Boolean isMine,
        List<String> tags
) {

    public RecipeListProjection(Long recipeId, String title, String mainImageUrl, Integer cookTime,
            Double averageRating, Integer servings, Boolean isScrapped, String nickName,
            Boolean isMine) {
        this(recipeId, title, mainImageUrl, cookTime, averageRating, servings, isScrapped, nickName,
                isMine, Collections.emptyList());
    }

    public RecipeListProjection updateTags(List<String> newTags) {
        return new RecipeListProjection(
                recipeId,
                title,
                mainImageUrl,
                cookTime,
                averageRating,
                servings,
                isScrapped,
                nickName,
                isMine,
                newTags
        );
    }

}
