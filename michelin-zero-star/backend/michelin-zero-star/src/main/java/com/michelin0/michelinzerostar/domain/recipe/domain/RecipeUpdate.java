package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.michelin0.michelinzerostar.domain.category.domain.RecipeCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RecipeUpdate {

    private final RecipeRepository recipeRepository;
    private final RecipeCategoryRepository recipeCategoryRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final RecipeStepRepository recipeStepRepository;
    private final RecipeTagRepository recipeTagRepository;

    public Recipe updateRecipe(Recipe recipe) {

        // 1. 레시피 아이디로 찾고 없으면 에러
        Recipe searchedRecipe = recipeRepository.getById(recipe.getRecipeId());
        // 2. 찾은 레시피 메모리에 저장

        // 3. 해당 레시피가 현재 로그인한 유저의 레시피인지 검사

        // 4.

        return null;
    }
}
