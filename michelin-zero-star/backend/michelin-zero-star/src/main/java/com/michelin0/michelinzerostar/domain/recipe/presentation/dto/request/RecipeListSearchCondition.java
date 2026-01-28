package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.request;

import com.michelin0.michelinzerostar.domain.recipe.domain.enums.RecipeSortType;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipesSearchCondition;
import jakarta.validation.constraints.NotBlank;

public record RecipeListSearchCondition(
        @NotBlank(message = "레시피 타입을 입력해주세요.")
        String recipeType,
        String category,
        String searchWord,
        @NotBlank(message = "정렬 기준을 입력해주세요.")
        String sort
) {
        public RecipesSearchCondition toCondition() {
                return new RecipesSearchCondition(
                        this.recipeType,
                        this.category,
                        this.searchWord,
                        RecipeSortType.valueOf(this.sort.toUpperCase())
                );
        }
}