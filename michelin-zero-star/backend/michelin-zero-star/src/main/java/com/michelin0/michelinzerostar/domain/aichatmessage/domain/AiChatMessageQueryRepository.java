package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import static com.michelin0.michelinzerostar.domain.aichatmessage.domain.QAiChatMessage.aiChatMessage;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AiChatMessageQueryRepository {

    private final JPAQueryFactory queryFactory;

    public List<AiChatMessage> getChatHistoryByUserAndRecipe(
            Long userId,
            Long recipeId,
            Long lastMessageId,
            int pageSize
    ) {
        return queryFactory.selectFrom(aiChatMessage)
                .where(
                        aiChatMessage.recipe.recipeId.eq(recipeId),
                        aiChatMessage.user.id.eq(userId),
                        lessThanLastMessageId(lastMessageId)
                )
                .orderBy(aiChatMessage.aiChatMessageId.desc())
                .limit(pageSize + 1)
                .fetch();
    }

    private BooleanExpression lessThanLastMessageId(Long lastMessageId) {
        if (lastMessageId == null) {
            return null;
        }
        return aiChatMessage.aiChatMessageId.lt(lastMessageId);
    }

}
