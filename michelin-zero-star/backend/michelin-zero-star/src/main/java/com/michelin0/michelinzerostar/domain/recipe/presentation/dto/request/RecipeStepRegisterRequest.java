package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.request;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeStepCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RecipeStepRegisterRequest(
        @NotNull(message = "단계 번호를 입력하세요.")
        Integer stepNumber,
        @NotBlank(message = "단계를 설명해주세요.")
        String stepDescription,
        @NotNull(message = "현재 단계의 소요 시간(분)을 입력해주세요.")
        Integer timerSeconds,
        @NotBlank(message = "현재 단계의 이미지를 등록해주세요.")
        String stepImageUrl,
        String cookingTip

) {

    public RecipeStepCommand toCommand() {
        return new RecipeStepCommand(
                stepNumber,
                stepDescription,
                timerSeconds,
                stepImageUrl,
                cookingTip
        );
    }

}
