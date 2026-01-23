package com.michelin0.michelinzerostar.domain.recipe.domain.dto;

public record RecipeSearchCondition(
        String category,
        String sort,
        String keyword // 일단 제목 기준으로 매칭 시키기
) {

}
