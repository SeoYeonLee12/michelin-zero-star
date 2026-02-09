package com.michelin0.michelinzerostar.domain.cookinglog.presentation.dto;

import jakarta.validation.constraints.NotNull;

public record CookingLogCompleteRequest(
        @NotNull(message = "요리를 완료한 레시피 아이디를 입력하세요.")
        Long recipeId
) {

}
