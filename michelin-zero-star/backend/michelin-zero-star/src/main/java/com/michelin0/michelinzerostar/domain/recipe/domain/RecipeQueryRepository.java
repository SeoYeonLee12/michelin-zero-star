package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.michelin0.michelinzerostar.domain.category.domain.QCategory.category;
import static com.michelin0.michelinzerostar.domain.category.domain.QRecipeCategory.recipeCategory;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe.recipe;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipeIngredient.recipeIngredient;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipeStep.recipeStep;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipeTag.recipeTag;
import static com.michelin0.michelinzerostar.domain.recipescrap.domain.QRecipeScrap.recipeScrap;
import static com.michelin0.michelinzerostar.domain.user.entity.QUser.user;
import com.michelin0.michelinzerostar.domain.category.domain.QCategory;
import com.michelin0.michelinzerostar.domain.category.domain.QRecipeCategory;
import com.michelin0.michelinzerostar.domain.recipe.domain.enums.RecipeSortType;
import com.michelin0.michelinzerostar.domain.recipe.domain.enums.RecipeType;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.CookModeProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.CookModeRecipeStepProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeDetailProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeIngredientProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeListProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeStepProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeTagGetListProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeTagProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipesSearchCondition;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

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

        Boolean isMine = foundRecipe.getUser().getId().equals(loginUserId);
        Boolean isScrapped = checkIsScrapped(recipeId, loginUserId
        );

        // 카테고리명 태그 재료 단계
        List<String> categoryNames = queryFactory
                .select(category.categoryName)
                .from(recipeCategory)
                .join(recipeCategory.category, category)
                .where(recipeCategory.recipe.recipeId.eq(recipeId))
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

    public Optional<CookModeProjection> findRecipeStepByRecipeId(Long recipeId) {
        Tuple searchedRecipe = queryFactory
                .select(
                        recipe.recipeId,
                        recipe.title,
                        JPAExpressions
                                .select(recipeStep.count())
                                .from(recipeStep)
                                .where(recipeStep.recipe.recipeId.eq(recipeId))
                )
                .from(recipe)
                .where(recipe.recipeId.eq(recipeId))
                .fetchOne();

        if (searchedRecipe == null) {
            return Optional.empty();
        }

        List<CookModeRecipeStepProjection> steps = queryFactory
                .select(Projections.constructor(
                        CookModeRecipeStepProjection.class,
                        recipeStep.recipeStepId,
                        recipeStep.stepNumber,
                        recipeStep.stepDescription,
                        recipeStep.stepImageUrl,
                        recipeStep.timerSeconds,
                        recipeStep.cookingTip
                ))
                .from(recipeStep)
                .where(recipeStep.recipe.recipeId.eq(recipeId))
                .orderBy(recipeStep.stepNumber.asc())
                .fetch();

        Long searchedRecipeId = searchedRecipe.get(recipe.recipeId);
        String searchedTitle = searchedRecipe.get(recipe.title);

        Long totalStepCount = searchedRecipe.get(2, Long.class);
        Integer totalStep = (totalStepCount != null) ? totalStepCount.intValue() : 0;

        return Optional.of(new CookModeProjection(
                searchedRecipeId,
                searchedTitle,
                totalStep,
                steps
        ));
    }

    public Page<RecipeListProjection> findAllRecipes(RecipesSearchCondition condition,
            Pageable pageable, Long userId) {
        List<Long> ids = queryFactory
                .select(recipe.recipeId)
                .from(recipe)
                .where(
                        eqRecipeType(condition.recipeType()),
                        eqCategory(condition.category()),
                        containsSearchWord(condition.searchWord())
                )
                .orderBy(getOrderSpecifier(condition.sort()))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        if (ids.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        List<RecipeListProjection> content = queryFactory
                .select(Projections.constructor(
                        RecipeListProjection.class,
                        recipe.recipeId,
                        recipe.title,
                        recipe.mainImageUrl,
                        recipe.averageRating,
                        isScrappedExpression(userId),
                        recipe.user.nickname,
                        (userId != null) ? recipe.user.id.eq(userId) : Expressions.asBoolean(false)
                ))
                .from(recipe)
                .join(recipe.user)
                .where(recipe.recipeId.in(ids))
                .orderBy(getOrderSpecifier(condition.sort()))
                .fetch();

        Long totalCount = queryFactory
                .select(recipe.count())
                .from(recipe)
                .where(
                        eqRecipeType(condition.recipeType()),
                        eqCategory(condition.category()),
                        containsSearchWord(condition.searchWord())
                )
                .fetchOne();

        List<RecipeTagGetListProjection> tags = queryFactory
                .select(Projections.constructor(
                        RecipeTagGetListProjection.class,
                        recipeTag.recipe.recipeId,
                        recipeTag.tagName)
                )
                .from(recipeTag)
                .where(recipeTag.recipe.recipeId.in(ids))
                .fetch();

        Map<Long, List<String>> tagMap = tags.stream()
                .collect(Collectors.groupingBy(
                        RecipeTagGetListProjection::recipeId,
                        Collectors.mapping(RecipeTagGetListProjection::tagName, Collectors.toList())
                ));

        List<RecipeListProjection> finalContent = content.stream()
                .map(recipe -> recipe.updateTags(
                        tagMap.getOrDefault(recipe.recipeId(), Collections.emptyList())))
                .toList();

        return new PageImpl<>(finalContent, pageable, totalCount != null ? totalCount : 0);
    }

    private OrderSpecifier<?> getOrderSpecifier(RecipeSortType sortType) {
        if (sortType == null) {
            return recipe.createdAt.desc();
        }

        Order direction = sortType.getDirection().equalsIgnoreCase("ASC")
                ? Order.ASC : Order.DESC;

        Expression<? extends Comparable> field = switch (sortType) {
            case RATING -> recipe.averageRating;
            case TIME -> recipe.cookTime;
            case LATEST -> recipe.createdAt;
        };

        return new OrderSpecifier(direction, field);
    }

    private BooleanExpression eqRecipeType(String recipeTypeStr) {
        if (!StringUtils.hasText(recipeTypeStr)) {
            return null;
        }
        try {
            RecipeType type = RecipeType.valueOf(recipeTypeStr.toUpperCase());
            return recipe.recipeType.eq(type);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private BooleanExpression eqCategory(String categoryName) {
        if (!StringUtils.hasText(categoryName)) {
            return null;
        }

        // 1. 카테고리 이름으로 ID 조회 (서브쿼리)
        // SELECT categories_id FROM categories WHERE category_name = '면'
        return recipe.recipeId.in(
                JPAExpressions.select(recipeCategory.recipe.recipeId)
                        .from(recipeCategory)
                        .where(recipeCategory.category.categoryId.eq(
                                JPAExpressions.select(category.categoryId)
                                        .from(category)
                                        .where(category.categoryName.eq(categoryName))
                        ))
        );
    }

    private BooleanExpression isScrappedExpression(Long userId) {
        if (userId == null) {
            return Expressions.asBoolean(false);
        }

        return JPAExpressions
                .selectOne()
                .from(recipeScrap)
                .where(
                        recipeScrap.recipe.recipeId.eq(recipe.recipeId),
                        recipeScrap.user.id.eq(userId)
                )
                .exists();
    }

    private BooleanExpression containsSearchWord(String searchWord) {
        if (!StringUtils.hasText(searchWord)) {
            return null;
        }
        String replacedSearchWord = searchWord.replace(" ", "");
        return Expressions.stringTemplate("REPLACE({0}, ' ', '')", recipe.title)
                .contains(replacedSearchWord);
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
                recipe.getUser().getProfileImageUrl(),
                recipe.getUser().getTotalStar(),
                isScrapped,
                isMine,
                categoryNames,
                tags,
                ingredients,
                steps
        );
    }
}
