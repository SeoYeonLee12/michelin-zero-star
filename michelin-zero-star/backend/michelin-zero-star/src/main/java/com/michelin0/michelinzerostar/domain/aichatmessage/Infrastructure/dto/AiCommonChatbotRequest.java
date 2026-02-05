package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.List;

public record AiCommonChatbotRequest(
        Long user_id,
        String query,
        List<String> user_favorite_categories
) {

    public static AiCommonChatbotRequest of(
            User user,
            String content,
            List<String> userFavoriteCategories
    ) {
        return new AiCommonChatbotRequest(
                user.getId(),
                content,
                userFavoriteCategories
        );
    }

}
