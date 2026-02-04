package com.michelin0.michelinzerostar.global.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QSoftDeleteDomain is a Querydsl query type for SoftDeleteDomain
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultSupertypeSerializer")
public class QSoftDeleteDomain extends EntityPathBase<SoftDeleteDomain> {

    private static final long serialVersionUID = -1244711993L;

    public static final QSoftDeleteDomain softDeleteDomain = new QSoftDeleteDomain("softDeleteDomain");

    public final QBaseDomain _super = new QBaseDomain(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QSoftDeleteDomain(String variable) {
        super(SoftDeleteDomain.class, forVariable(variable));
    }

    public QSoftDeleteDomain(Path<? extends SoftDeleteDomain> path) {
        super(path.getType(), path.getMetadata());
    }

    public QSoftDeleteDomain(PathMetadata metadata) {
        super(SoftDeleteDomain.class, metadata);
    }

}

