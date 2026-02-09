package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

public record RecipeNutritionResponse(
        Double calorie,
        Double carbohydrate,
        Double protein,
        Double saturatedFat,
        Double cholesterol,
        Double sodium,
        Double calcium
) {

}
