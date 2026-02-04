package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipeIngredient is a Querydsl query type for RecipeIngredient
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipeIngredient extends EntityPathBase<RecipeIngredient> {

    private static final long serialVersionUID = -2058255420L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipeIngredient recipeIngredient = new QRecipeIngredient("recipeIngredient");

    public final com.michelin0.michelinzerostar.global.domain.QBaseDomain _super = new com.michelin0.michelinzerostar.global.domain.QBaseDomain(this);

    public final StringPath amount = createString("amount");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath ingredientName = createString("ingredientName");

    public final NumberPath<Long> ingredientsId = createNumber("ingredientsId", Long.class);

    public final QRecipe recipe;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QRecipeIngredient(String variable) {
        this(RecipeIngredient.class, forVariable(variable), INITS);
    }

    public QRecipeIngredient(Path<? extends RecipeIngredient> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipeIngredient(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipeIngredient(PathMetadata metadata, PathInits inits) {
        this(RecipeIngredient.class, metadata, inits);
    }

    public QRecipeIngredient(Class<? extends RecipeIngredient> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.recipe = inits.isInitialized("recipe") ? new QRecipe(forProperty("recipe"), inits.get("recipe")) : null;
    }

}

