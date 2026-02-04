package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QAiChatMessage is a Querydsl query type for AiChatMessage
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAiChatMessage extends EntityPathBase<AiChatMessage> {

    private static final long serialVersionUID = 1020373023L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QAiChatMessage aiChatMessage = new QAiChatMessage("aiChatMessage");

    public final com.michelin0.michelinzerostar.global.domain.QBaseDomain _super = new com.michelin0.michelinzerostar.global.domain.QBaseDomain(this);

    public final NumberPath<Long> aiChatMessageId = createNumber("aiChatMessageId", Long.class);

    public final StringPath content = createString("content");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe recipe;

    public final StringPath recommendedRecipes = createString("recommendedRecipes");

    public final EnumPath<com.michelin0.michelinzerostar.domain.aichatmessage.domain.enums.SenderType> senderType = createEnum("senderType", com.michelin0.michelinzerostar.domain.aichatmessage.domain.enums.SenderType.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser user;

    public QAiChatMessage(String variable) {
        this(AiChatMessage.class, forVariable(variable), INITS);
    }

    public QAiChatMessage(Path<? extends AiChatMessage> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QAiChatMessage(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QAiChatMessage(PathMetadata metadata, PathInits inits) {
        this(AiChatMessage.class, metadata, inits);
    }

    public QAiChatMessage(Class<? extends AiChatMessage> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.recipe = inits.isInitialized("recipe") ? new com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe(forProperty("recipe"), inits.get("recipe")) : null;
        this.user = inits.isInitialized("user") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("user"), inits.get("user")) : null;
    }

}

