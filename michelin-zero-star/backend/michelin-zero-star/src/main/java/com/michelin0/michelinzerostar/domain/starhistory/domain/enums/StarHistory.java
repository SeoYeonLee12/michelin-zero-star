package com.michelin0.michelinzerostar.domain.starhistory.domain.enums;

public enum StarHistoryType {

    COOK_COMPLETE("요리완성", 0.5),
    RECIPE_REGISTER("레시피등록", 1.0),
    ;

    private String type;
    private Double amount;

    StarHistory(String type, double amount) {

    }
}