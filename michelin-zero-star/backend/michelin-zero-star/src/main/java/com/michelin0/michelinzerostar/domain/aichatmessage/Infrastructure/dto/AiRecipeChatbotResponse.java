package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import jakarta.validation.constraints.NotEmpty;

public record AiRecipeChatbotResponse(
        @NotEmpty(message = "AI 응답을 전송해주세요.")
        String answer
) {

}
