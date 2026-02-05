package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.global.exception.errorcode.AiChatMessageErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.time.LocalDateTime;
import java.util.List;

public record CommonAiAnswer(
        String content,
        List<AiRecipeRecommendation> recommendations,
        String senderType,
        LocalDateTime sendDateTime
) {

    public CommonAiAnswer {
        if (content == null || content.isBlank()) {
            throw new GlobalException(AiChatMessageErrorCode.EMPTY_CONTENT);
        }
    }
}