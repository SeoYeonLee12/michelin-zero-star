package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipeTag is a Querydsl query type for RecipeTag
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipeTag extends EntityPathBase<RecipeTag> {

    private static final long serialVersionUID = -803559161L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipeTag recipeTag = new QRecipeTag("recipeTag");

    public final com.michelin0.michelinzerostar.global.domain.QBaseDomain _super = new com.michelin0.michelinzerostar.global.domain.QBaseDomain(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final QRecipe recipe;

    public final NumberPath<Long> tagId = createNumber("tagId", Long.class);

    public final StringPath tagName = createString("tagName");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QRecipeTag(String variable) {
        this(RecipeTag.class, forVariable(variable), INITS);
    }

    public QRecipeTag(Path<? extends RecipeTag> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipeTag(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipeTag(PathMetadata metadata, PathInits inits) {
        this(RecipeTag.class, metadata, inits);
    }

    public QRecipeTag(Class<? extends RecipeTag> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.recipe = inits.isInitialized("recipe") ? new QRecipe(forProperty("recipe"), inits.get("recipe")) : null;
    }

}

