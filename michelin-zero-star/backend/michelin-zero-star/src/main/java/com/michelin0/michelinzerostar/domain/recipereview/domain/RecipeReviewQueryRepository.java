package com.michelin0.michelinzerostar.domain.recipereview.domain;

import static com.michelin0.michelinzerostar.domain.recipereview.domain.QRecipeReview.recipeReview;
import static com.michelin0.michelinzerostar.domain.user.entity.QUser.user;

import com.michelin0.michelinzerostar.domain.recipereview.domain.projection.RecipeReviewListProjection;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RecipeReviewQueryRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public Page<RecipeReviewListProjection> findByRecipe(Long recipeId, Long userId,
            Pageable pageable) {
        List<RecipeReviewListProjection> content = jpaQueryFactory.select(Projections.constructor(
                        RecipeReviewListProjection.class,
                        user.id,
                        user.nickname,
                        user.profileImageUrl,
                        recipeReview.reviewId,
                        recipeReview.createdAt,
                        recipeReview.rating,
                        recipeReview.content,
                        isMine(userId),
                        user.totalStar
                ))
                .from(recipeReview)
                .join(recipeReview.user, user)
                .where(recipeReview.recipe.recipeId.eq(recipeId))
                .orderBy(recipeReview.createdAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        JPAQuery<Long> countQuery = jpaQueryFactory
                .select(recipeReview.count())
                .from(recipeReview)
                .where(recipeReview.recipe.recipeId.eq(recipeId));

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression isMine(Long userId) {
        if (userId == null) {
            return Expressions.asBoolean(false);
        }
        return recipeReview.user.id.eq(userId);
    }
}
