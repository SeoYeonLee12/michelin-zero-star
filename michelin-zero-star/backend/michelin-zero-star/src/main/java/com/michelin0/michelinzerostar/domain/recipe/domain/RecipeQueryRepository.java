package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.michelin0.michelinzerostar.domain.RecipeScrap.domain.QRecipeScrap.recipeScrap;
import static com.michelin0.michelinzerostar.domain.category.domain.QCategory.category;
import static com.michelin0.michelinzerostar.domain.category.domain.QRecipeCategory.recipeCategory;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe.recipe;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipeIngredient.recipeIngredient;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipeStep.recipeStep;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipeTag.recipeTag;
import static com.michelin0.michelinzerostar.domain.user.entity.QUser.user;

import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeDetailProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeIngredientProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeStepProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeTagProjection;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RecipeQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Optional<RecipeDetailProjection> findRecipeById(Long recipeId, Long loginUserId) {

        Recipe foundRecipe = queryFactory
                .selectFrom(recipe)
                .join(recipe.user, user).fetchJoin()
                .where(recipeIdEq(recipeId))
                .fetchOne();

        if (foundRecipe == null) {
            return Optional.empty();
        }

        Boolean isMine = (loginUserId != null) && foundRecipe.getUser().getId().equals(loginUserId);
        Boolean isScrapped = checkIsScrapped(recipeId, loginUserId
        );

        // 카테고리명 태그 재료 단계
        List<String> categoryNames = queryFactory
                .select(category.categoryName)
                .from(recipeCategory)
                .join(recipeCategory.category, category)
                .where(recipeCategory.recipe.recipeId.eq(recipe.recipeId))
                .fetch();

        List<RecipeTagProjection> tags = queryFactory
                .select(Projections.constructor(
                        RecipeTagProjection.class,
                        recipeTag.tagName)
                )
                .from(recipeTag)
                .where(recipeTag.recipe.recipeId.eq(recipeId))
                .fetch();

        List<RecipeIngredientProjection> ingredients = queryFactory
                .select(Projections.constructor(
                        RecipeIngredientProjection.class,
                        recipeIngredient.ingredientName, recipeIngredient.amount)
                )
                .from(recipeIngredient)
                .where(recipeIngredient.recipe.recipeId.eq(recipeId))
                .fetch();

        List<RecipeStepProjection> steps = queryFactory
                .select(Projections.constructor(
                                RecipeStepProjection.class,
                                recipeStep.stepNumber,
                                recipeStep.stepDescription,
                                recipeStep.timerSeconds,
                                recipeStep.stepImageUrl,
                                recipeStep.cookingTip
                        )
                )
                .from(recipeStep)
                .where(recipeStep.recipe.recipeId.eq(recipeId))
                .orderBy(recipeStep.stepNumber.asc())
                .fetch();

        return Optional.of(
                toDetailDto(foundRecipe, categoryNames, tags, ingredients, steps, isScrapped,
                        isMine));
    }

    private Boolean checkIsScrapped(Long recipeId, Long userId) {
        if (userId == null) {
            return false;
        }
        Integer fetchOne = queryFactory
                .selectOne()
                .from(recipeScrap)
                .where(
                        recipeScrap.recipe.recipeId.eq(recipeId),
                        recipeScrap.user.id.eq(userId)
                )
                .fetchFirst();

        return fetchOne != null;
    }

    private BooleanExpression recipeIdEq(Long recipeId) {
        return recipeId != null ? recipe.recipeId.eq(recipeId) : null;
    }

    private RecipeDetailProjection toDetailDto(
            Recipe recipe,
            List<String> categoryNames,
            List<RecipeTagProjection> tags,
            List<RecipeIngredientProjection> ingredients,
            List<RecipeStepProjection> steps,
            Boolean isScrapped,
            Boolean isMine
    ) {
        return new RecipeDetailProjection(
                recipe.getRecipeId(),
                recipe.getUser().getId(),
                recipe.getTitle(),
                recipe.getMainImageUrl(),
                recipe.getDescription(),
                recipe.getCookTime(),
                recipe.getServings(),
                recipe.getScrapCount(),
                recipe.getReviewCount(),
                recipe.getAverageRating(),
                recipe.getRecipeType().name(),
                recipe.getNutrition().getCalorie(),
                recipe.getNutrition().getCarbohydrate(),
                recipe.getNutrition().getProtein(),
                recipe.getNutrition().getSaturatedFat(),
                recipe.getNutrition().getCholesterol(),
                recipe.getNutrition().getSodium(),
                recipe.getNutrition().getCalcium(),
                recipe.getCreatedAt(),
                recipe.getUpdatedAt(),
                recipe.getUser().getNickname(),
                isScrapped,
                isMine,
                categoryNames,
                tags,
                ingredients,
                steps
        );
    }
}