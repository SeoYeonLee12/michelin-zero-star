package com.michelin0.michelinzerostar.domain.recipe.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecipeType {

    USER("user", "레시피 도서관"),
    CHEF("chef", "레시피 연구소");

    private final String type;
    private final String displayName;
}
