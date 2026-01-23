package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.michelin0.michelinzerostar.domain.recipe.domain.QRecipe.recipe;
import static com.michelin0.michelinzerostar.domain.user.entity.QUser.user;

import com.michelin0.michelinzerostar.domain.recipe.domain.dto.RecipeDetailDto;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RecipeRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    public Optional<RecipeDetailDto> findById() {
        Optional.of(RecipeDetailDto detailRecipe = queryFactory
                .select(new ())
                .from(recipe)
                .join(recipe.user, user)
                .fetchOne();

)
    }

//    public List<RecipeListDto> findByAll(RecipeSearchCondition condition) {
//        List<RecipeListDto> recipes = queryFactory
//                .select(
//                )
//
//    }
}

