package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.global.exception.errorcode.AiChatMessageErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.List;

public record CommonAiAnswer(
        String content,
        List<AiRecipeRecommendation> recommendations
) {
    public CommonAiAnswer {
        if (content == null || content.isBlank()) {
            throw new GlobalException(AiChatMessageErrorCode.NOT_EMPTY_CONTENT);
        }
    }

}