package com.michelin0.michelinzerostar.domain.aichatmessage.application.command;

public record RecipeChatbotCommand(
        Long userId,
        Long recipeId,
        String userQuery,
        Integer currentStepNumber
) {


}
