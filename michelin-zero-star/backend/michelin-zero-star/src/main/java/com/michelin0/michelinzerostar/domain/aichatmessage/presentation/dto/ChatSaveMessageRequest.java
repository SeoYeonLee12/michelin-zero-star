package com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record ChatSaveMessageRequest(
        @NotEmpty(message = "질문을 입력하세요.")
        String content,
        @NotNull(message = "레시피를 입력해주세요.")
        Long recipeId,
        @NotNull(message = "현재 유저 아이디를 입력해주세요.")
        Long userId,
        @NotNull(message = "현재 유저가 보고있는 단계를 입력하세요.")
        Integer currentStepNumber
) {

}
