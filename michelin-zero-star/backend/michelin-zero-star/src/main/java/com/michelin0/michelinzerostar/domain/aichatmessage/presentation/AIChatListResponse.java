package com.michelin0.michelinzerostar.domain.aichatmessage.presentation;

import java.util.List;

public record AIChatListResponse(
        List<AiChatHistoryResponse> aiChatHistories,
        Long nextCursorId,
        boolean hasNext
) {

    public static AIChatListResponse of(
            List<AiChatHistoryResponse> aiChatHistories,
            Long nextCursorId,
            boolean hasNext
    ) {
        return new AIChatListResponse(aiChatHistories, nextCursorId, hasNext);
    }
}
