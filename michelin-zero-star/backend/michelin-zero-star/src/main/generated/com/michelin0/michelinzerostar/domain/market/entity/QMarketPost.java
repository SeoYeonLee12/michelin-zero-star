package com.michelin0.michelinzerostar.domain.market.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMarketPost is a Querydsl query type for MarketPost
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMarketPost extends EntityPathBase<MarketPost> {

    private static final long serialVersionUID = 290380592L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMarketPost marketPost = new QMarketPost("marketPost");

    public final com.michelin0.michelinzerostar.global.domain.QSoftDeleteDomain _super = new com.michelin0.michelinzerostar.global.domain.QSoftDeleteDomain(this);

    public final StringPath category = createString("category");

    public final NumberPath<Integer> chatCount = createNumber("chatCount", Integer.class);

    public final StringPath content = createString("content");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> deletedAt = _super.deletedAt;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final ListPath<MarketPostImage, QMarketPostImage> images = this.<MarketPostImage, QMarketPostImage>createList("images", MarketPostImage.class, QMarketPostImage.class, PathInits.DIRECT2);

    public final NumberPath<java.math.BigDecimal> latitude = createNumber("latitude", java.math.BigDecimal.class);

    public final NumberPath<Integer> likeCount = createNumber("likeCount", Integer.class);

    public final StringPath locationCode = createString("locationCode");

    public final StringPath locationText = createString("locationText");

    public final NumberPath<java.math.BigDecimal> longitude = createNumber("longitude", java.math.BigDecimal.class);

    public final StringPath meetingPlace = createString("meetingPlace");

    public final NumberPath<Integer> price = createNumber("price", Integer.class);

    public final EnumPath<PostStatus> status = createEnum("status", PostStatus.class);

    public final StringPath title = createString("title");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser writer;

    public QMarketPost(String variable) {
        this(MarketPost.class, forVariable(variable), INITS);
    }

    public QMarketPost(Path<? extends MarketPost> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMarketPost(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMarketPost(PathMetadata metadata, PathInits inits) {
        this(MarketPost.class, metadata, inits);
    }

    public QMarketPost(Class<? extends MarketPost> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.writer = inits.isInitialized("writer") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("writer"), inits.get("writer")) : null;
    }

}

