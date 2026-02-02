package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QNutrition is a Querydsl query type for Nutrition
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEmbeddableSerializer")
public class QNutrition extends BeanPath<Nutrition> {

    private static final long serialVersionUID = -1889155725L;

    public static final QNutrition nutrition = new QNutrition("nutrition");

    public final NumberPath<Double> calcium = createNumber("calcium", Double.class);

    public final NumberPath<Double> calorie = createNumber("calorie", Double.class);

    public final NumberPath<Double> carbohydrate = createNumber("carbohydrate", Double.class);

    public final NumberPath<Double> cholesterol = createNumber("cholesterol", Double.class);

    public final NumberPath<Double> protein = createNumber("protein", Double.class);

    public final NumberPath<Double> saturatedFat = createNumber("saturatedFat", Double.class);

    public final NumberPath<Double> sodium = createNumber("sodium", Double.class);

    public QNutrition(String variable) {
        super(Nutrition.class, forVariable(variable));
    }

    public QNutrition(Path<? extends Nutrition> path) {
        super(path.getType(), path.getMetadata());
    }

    public QNutrition(PathMetadata metadata) {
        super(Nutrition.class, metadata);
    }

}

