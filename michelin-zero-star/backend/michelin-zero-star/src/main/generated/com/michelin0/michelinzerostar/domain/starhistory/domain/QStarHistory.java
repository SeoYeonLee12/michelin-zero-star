package com.michelin0.michelinzerostar.domain.starhistory.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QStarHistory is a Querydsl query type for StarHistory
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QStarHistory extends EntityPathBase<StarHistory> {

    private static final long serialVersionUID = 922194207L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QStarHistory starHistory = new QStarHistory("starHistory");

    public final com.michelin0.michelinzerostar.global.domain.QBaseDomain _super = new com.michelin0.michelinzerostar.global.domain.QBaseDomain(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Long> historyId = createNumber("historyId", Long.class);

    public final NumberPath<Double> starAmount = createNumber("starAmount", Double.class);

    public final EnumPath<com.michelin0.michelinzerostar.domain.starhistory.domain.enums.StarHistoryType> type = createEnum("type", com.michelin0.michelinzerostar.domain.starhistory.domain.enums.StarHistoryType.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser user;

    public QStarHistory(String variable) {
        this(StarHistory.class, forVariable(variable), INITS);
    }

    public QStarHistory(Path<? extends StarHistory> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QStarHistory(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QStarHistory(PathMetadata metadata, PathInits inits) {
        this(StarHistory.class, metadata, inits);
    }

    public QStarHistory(Class<? extends StarHistory> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("user"), inits.get("user")) : null;
    }

}

