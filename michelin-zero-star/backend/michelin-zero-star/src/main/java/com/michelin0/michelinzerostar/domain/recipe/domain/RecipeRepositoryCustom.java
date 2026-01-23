package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RecipeRepositoryCustom {

    private final JPAQueryFactory queryFactory;

//    public List<RecipeListDto> findByAll(RecipeSearchCondition condition) {
//        List<RecipeListDto> recipes = queryFactory
//                .select(
//                )
//
//    }
}

