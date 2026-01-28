package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import java.util.List;

public record RecipeListResponse(
        List<RecipesResponse> recipes
) {

}
