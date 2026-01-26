package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipe is a Querydsl query type for Recipe
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipe extends EntityPathBase<Recipe> {

    private static final long serialVersionUID = 1196151187L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipe recipe = new QRecipe("recipe");

    public final com.michelin0.michelinzerostar.global.domain.QSoftDeleteDomain _super = new com.michelin0.michelinzerostar.global.domain.QSoftDeleteDomain(this);

    public final NumberPath<Double> averageRating = createNumber("averageRating", Double.class);

    public final NumberPath<Integer> cookTime = createNumber("cookTime", Integer.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> deletedAt = _super.deletedAt;

    public final StringPath description = createString("description");

    public final StringPath mainImageUrl = createString("mainImageUrl");

    public final QNutrition nutrition;

    public final NumberPath<Long> recipeId = createNumber("recipeId", Long.class);

    public final EnumPath<com.michelin0.michelinzerostar.domain.recipe.enums.RecipeType> recipeType = createEnum("recipeType", com.michelin0.michelinzerostar.domain.recipe.enums.RecipeType.class);

    public final NumberPath<Integer> reviewCount = createNumber("reviewCount", Integer.class);

    public final NumberPath<Integer> scrapCount = createNumber("scrapCount", Integer.class);

    public final NumberPath<Integer> servings = createNumber("servings", Integer.class);

    public final StringPath title = createString("title");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.michelin0.michelinzerostar.domain.user.entity.QUser user;

    public QRecipe(String variable) {
        this(Recipe.class, forVariable(variable), INITS);
    }

    public QRecipe(Path<? extends Recipe> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipe(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipe(PathMetadata metadata, PathInits inits) {
        this(Recipe.class, metadata, inits);
    }

    public QRecipe(Class<? extends Recipe> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.nutrition = inits.isInitialized("nutrition") ? new QNutrition(forProperty("nutrition")) : null;
        this.user = inits.isInitialized("user") ? new com.michelin0.michelinzerostar.domain.user.entity.QUser(forProperty("user")) : null;
    }

}

