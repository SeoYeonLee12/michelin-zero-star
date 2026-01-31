package com.michelin0.michelinzerostar.domain.chat.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QChatRoom is a Querydsl query type for ChatRoom
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QChatRoom extends EntityPathBase<ChatRoom> {

    private static final long serialVersionUID = -2031148189L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QChatRoom chatRoom = new QChatRoom("chatRoom");

    public final com.michelin0.michelinzerostar.global.domain.QBaseTimeEntity _super = new com.michelin0.michelinzerostar.global.domain.QBaseTimeEntity(this);

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser buyer;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath lastMessage = createString("lastMessage");

    public final DateTimePath<java.time.LocalDateTime> lastMessageAt = createDateTime("lastMessageAt", java.time.LocalDateTime.class);

    public final com.michelin0.michelinzerostar.domain.market.entity.QMarketPost post;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser seller;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QChatRoom(String variable) {
        this(ChatRoom.class, forVariable(variable), INITS);
    }

    public QChatRoom(Path<? extends ChatRoom> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QChatRoom(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QChatRoom(PathMetadata metadata, PathInits inits) {
        this(ChatRoom.class, metadata, inits);
    }

    public QChatRoom(Class<? extends ChatRoom> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.buyer = inits.isInitialized("buyer") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("buyer"), inits.get("buyer")) : null;
        this.post = inits.isInitialized("post") ? new com.michelin0.michelinzerostar.domain.market.entity.QMarketPost(forProperty("post"), inits.get("post")) : null;
        this.seller = inits.isInitialized("seller") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("seller"), inits.get("seller")) : null;
    }

}

