package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RecipeRegister {

    private final RecipeRepository recipeRepository;
    private final RecipeStepRepository recipeStepRepository;
    private final RecipeTagRepository recipeTagRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;

    public Long recipeRegist(Recipe recipe,
            List<RecipeStep> recipeSteps,
            List<RecipeTag> recipeTags,
            List<RecipeIngredient> recipeIngredients
    ) {
        if (recipeRepository.existsByUserIdAndTitle(recipe.getUser().getId(), recipe.getTitle())) {
            throw new GlobalException(RecipeErrorCode.RECIPE_ALREADY_EXISTS);
        }
        Recipe newRecipe = recipeRepository.save(recipe);
        recipe.registerIngredients(recipeIngredients);
        recipe.registerSteps(recipeSteps);
        recipe.registerTags(recipeTags);

        recipeIngredientRepository.saveAll(recipeIngredients);
        recipeStepRepository.saveAll(recipeSteps);
        recipeTagRepository.saveAll(recipeTags);

        return newRecipe.getRecipeId();

    }

}
