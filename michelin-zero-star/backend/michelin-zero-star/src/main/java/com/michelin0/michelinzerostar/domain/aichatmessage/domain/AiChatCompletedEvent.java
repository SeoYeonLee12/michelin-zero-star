package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

public record AiChatCompletedEvent(
        Long userId,
        CommonAiAnswer answer
) {
    public static AiChatCompletedEvent of(Long userId, CommonAiAnswer answer) {
        return new AiChatCompletedEvent(userId, answer);
    }
}


