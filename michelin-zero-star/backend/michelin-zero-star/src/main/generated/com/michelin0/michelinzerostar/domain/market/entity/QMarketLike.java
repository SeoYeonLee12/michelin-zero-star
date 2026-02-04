package com.michelin0.michelinzerostar.domain.market.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMarketLike is a Querydsl query type for MarketLike
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMarketLike extends EntityPathBase<MarketLike> {

    private static final long serialVersionUID = 290255399L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMarketLike marketLike = new QMarketLike("marketLike");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QMarketPost marketPost;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser user;

    public QMarketLike(String variable) {
        this(MarketLike.class, forVariable(variable), INITS);
    }

    public QMarketLike(Path<? extends MarketLike> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMarketLike(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMarketLike(PathMetadata metadata, PathInits inits) {
        this(MarketLike.class, metadata, inits);
    }

    public QMarketLike(Class<? extends MarketLike> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.marketPost = inits.isInitialized("marketPost") ? new QMarketPost(forProperty("marketPost"), inits.get("marketPost")) : null;
        this.user = inits.isInitialized("user") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("user"), inits.get("user")) : null;
    }

}

