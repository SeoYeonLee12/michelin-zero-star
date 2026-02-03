package com.michelin0.michelinzerostar.domain.category.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipeCategory is a Querydsl query type for RecipeCategory
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipeCategory extends EntityPathBase<RecipeCategory> {

    private static final long serialVersionUID = -2125916063L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipeCategory recipeCategory = new QRecipeCategory("recipeCategory");

    public final com.michelin0.michelinzerostar.global.domain.QBaseDomain _super = new com.michelin0.michelinzerostar.global.domain.QBaseDomain(this);

    public final QCategory category;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe recipe;

    public final NumberPath<Long> recipeCategoryId = createNumber("recipeCategoryId", Long.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QRecipeCategory(String variable) {
        this(RecipeCategory.class, forVariable(variable), INITS);
    }

    public QRecipeCategory(Path<? extends RecipeCategory> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipeCategory(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipeCategory(PathMetadata metadata, PathInits inits) {
        this(RecipeCategory.class, metadata, inits);
    }

    public QRecipeCategory(Class<? extends RecipeCategory> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.category = inits.isInitialized("category") ? new QCategory(forProperty("category")) : null;
        this.recipe = inits.isInitialized("recipe") ? new com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe(forProperty("recipe"), inits.get("recipe")) : null;
    }

}

