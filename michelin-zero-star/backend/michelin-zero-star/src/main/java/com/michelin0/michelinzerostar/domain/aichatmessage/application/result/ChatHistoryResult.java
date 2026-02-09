package com.michelin0.michelinzerostar.domain.aichatmessage.application.result;

import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiChatMessage;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.enums.SenderType;
import java.time.LocalDateTime;

public record ChatHistoryResult(
        Long getAiChatMessageId,
        String content,
        SenderType senderType,
        LocalDateTime createdAt
) {

    public static ChatHistoryResult from(AiChatMessage message) {
        return new ChatHistoryResult(
                message.getAiChatMessageId(),
                message.getContent(),
                message.getSenderType(),
                message.getCreatedAt()
        );
    }
}
