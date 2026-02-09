package com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto;

import jakarta.validation.constraints.NotEmpty;

public record CommonChatMassageRequest(
        @NotEmpty(message = "현재 유저의 질문을 입력해주세요.")
        String content
) {

}
