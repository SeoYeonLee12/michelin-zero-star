package com.michelin0.michelinzerostar.domain.RecipeScrap.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipeScrap is a Querydsl query type for RecipeScrap
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipeScrap extends EntityPathBase<RecipeScrap> {

    private static final long serialVersionUID = -1814335553L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipeScrap recipeScrap = new QRecipeScrap("recipeScrap");

    public final com.michelin0.michelinzerostar.global.domain.QBaseDomain _super = new com.michelin0.michelinzerostar.global.domain.QBaseDomain(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe recipe;

    public final NumberPath<Long> scrapId = createNumber("scrapId", Long.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser user;

    public QRecipeScrap(String variable) {
        this(RecipeScrap.class, forVariable(variable), INITS);
    }

    public QRecipeScrap(Path<? extends RecipeScrap> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipeScrap(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipeScrap(PathMetadata metadata, PathInits inits) {
        this(RecipeScrap.class, metadata, inits);
    }

    public QRecipeScrap(Class<? extends RecipeScrap> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.recipe = inits.isInitialized("recipe") ? new com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe(forProperty("recipe"), inits.get("recipe")) : null;
        this.user = inits.isInitialized("user") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("user")) : null;
    }

}

