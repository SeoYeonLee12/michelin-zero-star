package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipeStep is a Querydsl query type for RecipeStep
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipeStep extends EntityPathBase<RecipeStep> {

    private static final long serialVersionUID = 859458303L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipeStep recipeStep = new QRecipeStep("recipeStep");

    public final StringPath cookingTip = createString("cookingTip");

    public final QRecipe recipe;

    public final NumberPath<Long> recipeStepId = createNumber("recipeStepId", Long.class);

    public final StringPath stepDescription = createString("stepDescription");

    public final StringPath stepImageUrl = createString("stepImageUrl");

    public final NumberPath<Integer> stepNumber = createNumber("stepNumber", Integer.class);

    public final NumberPath<Integer> timerSeconds = createNumber("timerSeconds", Integer.class);

    public QRecipeStep(String variable) {
        this(RecipeStep.class, forVariable(variable), INITS);
    }

    public QRecipeStep(Path<? extends RecipeStep> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipeStep(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipeStep(PathMetadata metadata, PathInits inits) {
        this(RecipeStep.class, metadata, inits);
    }

    public QRecipeStep(Class<? extends RecipeStep> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.recipe = inits.isInitialized("recipe") ? new QRecipe(forProperty("recipe"), inits.get("recipe")) : null;
    }

}

