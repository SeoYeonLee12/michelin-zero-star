package com.michelin0.michelinzerostar.domain.recipereview.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipereview.application.command.RecipeReviewCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RecipeReviewSaveRequest(
        @NotNull
        Long recipeId,
        Double rating,
        @NotBlank(message = "댓글 내용을 입력해주세요.")
        String content
) {

    public static RecipeReviewSaveRequest from(RecipeReviewCommand command) {
        return new RecipeReviewSaveRequest(command.recipeId(), command.rating(), command.content());
    }

}
