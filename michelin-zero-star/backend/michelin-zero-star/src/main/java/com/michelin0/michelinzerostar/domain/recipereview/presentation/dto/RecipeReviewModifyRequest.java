package com.michelin0.michelinzerostar.domain.recipereview.presentation.dto;

import jakarta.validation.constraints.NotEmpty;

public record RecipeReviewModifyRequest(
        @NotEmpty(message = "내용을 수정해주세요.")
        String content,
        Double rating
) {

}
