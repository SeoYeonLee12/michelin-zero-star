package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

import com.michelin0.michelinzerostar.domain.recipe.domain.enums.RecipeSortType;

public record RecipesSearchCondition(
        @jakarta.validation.constraints.NotBlank(message = "레시피 타입을 입력해주세요.") String recipeType,
        String category,
        String searchWord,
        RecipeSortType sort
) {

}