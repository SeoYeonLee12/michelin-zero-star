package com.michelin0.michelinzerostar.domain.recipe.application.result;

import com.michelin0.michelinzerostar.domain.recipe.domain.pr.MyRecipeListProjection;
import java.util.List;

public record MyRecipeListResult(
        Long recipeId,
        String title,
        String mainImageUrl,
        Double averageRating,
        String nickName,
        List<String> tags
) {

    public static MyRecipeListResult from(MyRecipeListProjection projections) {
        return new MyRecipeListResult(
                projections.recipeId(),
                projections.title(),
                projections.mainImageUrl(),
                projections.averageRating(),
                projections.nickName(),
                projections.tags()
        );
    }
}
