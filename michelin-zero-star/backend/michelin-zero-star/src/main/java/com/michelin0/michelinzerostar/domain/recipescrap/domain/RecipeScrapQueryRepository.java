package com.michelin0.michelinzerostar.domain.recipescrap.domain;

import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe.recipe;
import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipeTag.recipeTag;
import static com.michelin0.michelinzerostar.domain.recipescrap.domain.QRecipeScrap.recipeScrap;
import static com.michelin0.michelinzerostar.domain.user.entity.QUser.user;
import static com.querydsl.core.group.GroupBy.groupBy;
import static com.querydsl.core.group.GroupBy.list;

import com.michelin0.michelinzerostar.domain.recipescrap.domain.projection.ScrapRecipeListProjection;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RecipeScrapQueryRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public Page<ScrapRecipeListProjection> findAllByUserId(Long userId, Pageable pageable) {
        List<ScrapRecipeListProjection> scrapRecipeLists = jpaQueryFactory.select(
                        Projections.constructor(
                                ScrapRecipeListProjection.class,
                                recipe.recipeId,
                                recipe.title,
                                recipe.mainImageUrl,
                                recipe.averageRating,
                                recipe.user.nickname,
                                recipe.recipeType
                        ))
                .from(recipeScrap)
                .join(recipeScrap.recipe, recipe)
                .join(recipe.user, user)
                .where(recipeScrap.user.id.eq(userId))
                .orderBy(recipeScrap.scrapId.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        List<Long> recipeIds = scrapRecipeLists.stream()
                .map(ScrapRecipeListProjection::recipeId)
                .toList();

        Map<Long, List<String>> tagsMap = jpaQueryFactory
                .from(recipeTag)
                .where(recipeTag.recipe.recipeId.in(recipeIds))
                .transform(
                        groupBy(recipeTag.recipe.recipeId).as(
                                list(recipeTag.tagName)
                        )
                );

        List<ScrapRecipeListProjection> content = scrapRecipeLists.stream()
                .map(p -> p.updateTags(
                        tagsMap.getOrDefault(p.recipeId(), Collections.emptyList())
                ))
                .toList();

        JPAQuery<Long> countQuery = jpaQueryFactory
                .select(recipeScrap.count())
                .from(recipeScrap)
                .where(recipeScrap.user.id.eq(userId));
        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }
}
