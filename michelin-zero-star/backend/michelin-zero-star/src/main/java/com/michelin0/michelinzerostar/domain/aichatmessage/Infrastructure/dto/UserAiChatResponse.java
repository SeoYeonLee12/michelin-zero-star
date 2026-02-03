package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiChatMessage;

public record UserAiChatResponse(
        String content,
        String senderType,
        Long recipeId
) {

    public static UserAiChatResponse from(AiChatMessage message) {
        return new UserAiChatResponse(
                message.getContent(),
                message.getSenderType().name(),
                message.getRecipe().getRecipeId()
        );
    }
}
