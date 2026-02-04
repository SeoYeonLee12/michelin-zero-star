package com.michelin0.michelinzerostar.global.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBaseDomain is a Querydsl query type for BaseDomain
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultSupertypeSerializer")
public class QBaseDomain extends EntityPathBase<BaseDomain> {

    private static final long serialVersionUID = 1062445475L;

    public static final QBaseDomain baseDomain = new QBaseDomain("baseDomain");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QBaseDomain(String variable) {
        super(BaseDomain.class, forVariable(variable));
    }

    public QBaseDomain(Path<? extends BaseDomain> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBaseDomain(PathMetadata metadata) {
        super(BaseDomain.class, metadata);
    }

}

