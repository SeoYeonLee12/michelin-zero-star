package com.michelin0.michelinzerostar.domain.market.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMarketPostImage is a Querydsl query type for MarketPostImage
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMarketPostImage extends EntityPathBase<MarketPostImage> {

    private static final long serialVersionUID = -1696441333L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMarketPostImage marketPostImage = new QMarketPostImage("marketPostImage");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath imageUrl = createString("imageUrl");

    public final QMarketPost marketPost;

    public final NumberPath<Integer> orderIndex = createNumber("orderIndex", Integer.class);

    public QMarketPostImage(String variable) {
        this(MarketPostImage.class, forVariable(variable), INITS);
    }

    public QMarketPostImage(Path<? extends MarketPostImage> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMarketPostImage(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMarketPostImage(PathMetadata metadata, PathInits inits) {
        this(MarketPostImage.class, metadata, inits);
    }

    public QMarketPostImage(Class<? extends MarketPostImage> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.marketPost = inits.isInitialized("marketPost") ? new QMarketPost(forProperty("marketPost"), inits.get("marketPost")) : null;
    }

}

