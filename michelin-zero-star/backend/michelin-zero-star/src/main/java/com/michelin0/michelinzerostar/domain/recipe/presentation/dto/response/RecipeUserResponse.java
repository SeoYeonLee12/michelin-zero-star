package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

public record RecipeUserResponse(
        String nickname,
        Boolean isScrapped,
        Boolean isMine
) {

}

