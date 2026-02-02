package com.michelin0.michelinzerostar.domain.cookinglog.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QCookingLog is a Querydsl query type for CookingLog
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCookingLog extends EntityPathBase<CookingLog> {

    private static final long serialVersionUID = 1109967403L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QCookingLog cookingLog = new QCookingLog("cookingLog");

    public final com.michelin0.michelinzerostar.global.domain.QBaseDomain _super = new com.michelin0.michelinzerostar.global.domain.QBaseDomain(this);

    public final NumberPath<Long> cookingLogId = createNumber("cookingLogId", Long.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe recipe;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser user;

    public QCookingLog(String variable) {
        this(CookingLog.class, forVariable(variable), INITS);
    }

    public QCookingLog(Path<? extends CookingLog> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QCookingLog(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QCookingLog(PathMetadata metadata, PathInits inits) {
        this(CookingLog.class, metadata, inits);
    }

    public QCookingLog(Class<? extends CookingLog> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.recipe = inits.isInitialized("recipe") ? new com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe(forProperty("recipe"), inits.get("recipe")) : null;
        this.user = inits.isInitialized("user") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("user"), inits.get("user")) : null;
    }

}

