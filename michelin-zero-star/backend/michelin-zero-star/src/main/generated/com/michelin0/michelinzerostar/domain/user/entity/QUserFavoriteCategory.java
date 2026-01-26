package com.michelin0.michelinzerostar.domain.user.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QUserFavoriteCategory is a Querydsl query type for UserFavoriteCategory
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QUserFavoriteCategory extends EntityPathBase<UserFavoriteCategory> {

    private static final long serialVersionUID = -1133857368L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QUserFavoriteCategory userFavoriteCategory = new QUserFavoriteCategory("userFavoriteCategory");

    public final com.michelin0.michelinzerostar.domain.category.domain.QCategory category;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QUser user;

    public QUserFavoriteCategory(String variable) {
        this(UserFavoriteCategory.class, forVariable(variable), INITS);
    }

    public QUserFavoriteCategory(Path<? extends UserFavoriteCategory> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QUserFavoriteCategory(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QUserFavoriteCategory(PathMetadata metadata, PathInits inits) {
        this(UserFavoriteCategory.class, metadata, inits);
    }

    public QUserFavoriteCategory(Class<? extends UserFavoriteCategory> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.category = inits.isInitialized("category") ? new com.michelin0.michelinzerostar.domain.category.domain.QCategory(forProperty("category")) : null;
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

