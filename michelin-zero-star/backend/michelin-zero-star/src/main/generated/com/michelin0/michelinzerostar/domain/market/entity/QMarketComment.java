package com.michelin0.michelinzerostar.domain.market.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMarketComment is a Querydsl query type for MarketComment
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMarketComment extends EntityPathBase<MarketComment> {

    private static final long serialVersionUID = 2005787087L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMarketComment marketComment = new QMarketComment("marketComment");

    public final com.michelin0.michelinzerostar.global.domain.QBaseTimeEntity _super = new com.michelin0.michelinzerostar.global.domain.QBaseTimeEntity(this);

    public final ListPath<MarketComment, QMarketComment> children = this.<MarketComment, QMarketComment>createList("children", MarketComment.class, QMarketComment.class, PathInits.DIRECT2);

    public final StringPath content = createString("content");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QMarketPost marketPost;

    public final QMarketComment parent;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser writer;

    public QMarketComment(String variable) {
        this(MarketComment.class, forVariable(variable), INITS);
    }

    public QMarketComment(Path<? extends MarketComment> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMarketComment(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMarketComment(PathMetadata metadata, PathInits inits) {
        this(MarketComment.class, metadata, inits);
    }

    public QMarketComment(Class<? extends MarketComment> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.marketPost = inits.isInitialized("marketPost") ? new QMarketPost(forProperty("marketPost"), inits.get("marketPost")) : null;
        this.parent = inits.isInitialized("parent") ? new QMarketComment(forProperty("parent"), inits.get("parent")) : null;
        this.writer = inits.isInitialized("writer") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("writer"), inits.get("writer")) : null;
    }

}

