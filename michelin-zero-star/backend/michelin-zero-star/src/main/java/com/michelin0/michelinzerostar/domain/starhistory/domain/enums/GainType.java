package com.michelin0.michelinzerostar.domain.starhistory.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GainType {

    COOK_COMPLETE("cook complete", 0.5),
    RECIPE_REGISTER("recipe register", 1.0),
    ;

    private final String description;
    private final Double amount;
}
