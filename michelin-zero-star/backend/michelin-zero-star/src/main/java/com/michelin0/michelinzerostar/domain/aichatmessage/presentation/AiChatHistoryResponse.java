package com.michelin0.michelinzerostar.domain.aichatmessage.presentation;

import com.michelin0.michelinzerostar.domain.aichatmessage.application.result.ChatHistoryResult;
import java.time.LocalDateTime;

public record AiChatHistoryResponse(
        Long aiChatMessageId,
        String content,
        String senderType,
        LocalDateTime sendDate
) {

    public static AiChatHistoryResponse from(ChatHistoryResult chatHistoryResult) {
        return new AiChatHistoryResponse(
                chatHistoryResult.getAiChatMessageId(),
                chatHistoryResult.content(),
                chatHistoryResult.senderType().toString(),
                chatHistoryResult.createdAt()
        );
    }

}
