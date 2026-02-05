package com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto;

import jakarta.validation.constraints.NotNull;

public record RecipeScrapRequest(
        @NotNull(message = "레시피 아이디를 입력해주세요.")
        Long recipeId,
        @NotNull(message = "스크랩 여부를 알려주세요.")
        boolean isScrapped
) {

}
