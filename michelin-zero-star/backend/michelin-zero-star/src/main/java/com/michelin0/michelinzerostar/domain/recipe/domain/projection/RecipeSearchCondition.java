package com.michelin0.michelinzerostar.domain.recipe.domain.projection;

public record RecipeSearchCondition(
        String category,
        String sort,
        String keyword // 일단 제목 기준으로 매칭 시키기
) {

}
