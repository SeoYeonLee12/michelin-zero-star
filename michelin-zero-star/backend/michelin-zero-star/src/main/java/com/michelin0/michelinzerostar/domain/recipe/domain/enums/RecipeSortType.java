package com.michelin0.michelinzerostar.domain.recipe.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecipeSortType {
    LATEST("최신순", "DESC"),
    RATING("별점순", "DESC"),
    TIME("조리시간순", "ASC"),
    ;

    private final String description;
    private final String direction;
}
