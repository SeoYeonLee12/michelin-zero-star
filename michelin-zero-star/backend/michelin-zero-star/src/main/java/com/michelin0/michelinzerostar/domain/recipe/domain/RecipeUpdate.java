package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.michelin0.michelinzerostar.domain.category.domain.Category;
import com.michelin0.michelinzerostar.domain.category.domain.CategoryRepository;
import com.michelin0.michelinzerostar.domain.category.domain.RecipeCategory;
import com.michelin0.michelinzerostar.domain.category.domain.RecipeCategoryRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class RecipeUpdate {

    private final RecipeRepository recipeRepository;
    private final RecipeCategoryRepository recipeCategoryRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final RecipeStepRepository recipeStepRepository;
    private final RecipeTagRepository recipeTagRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public Recipe updateRecipe(
            Long recipeId,
            Recipe updatedRecipe,
            List<RecipeIngredient> ingredients,
            List<RecipeStep> steps,
            List<RecipeTag> tags,
            List<Long> categoryIds
    ) {

        Recipe searchedRecipe = recipeRepository.getById(recipeId);
        searchedRecipe.updateRecipe(updatedRecipe);

        recipeIngredientRepository.deleteAllBy(recipeId);
        recipeStepRepository.removeAllBy(recipeId);
        recipeTagRepository.removeAllBy(recipeId);
        recipeCategoryRepository.removeAllBy(recipeId);

        searchedRecipe.registerIngredients(ingredients);
        searchedRecipe.registerSteps(steps);
        searchedRecipe.registerTags(tags);

        List<Category> searchedCategories = categoryRepository.findAllById(categoryIds);
        if (searchedCategories.size() != categoryIds.size()) {
            throw new GlobalException(RecipeErrorCode.CATEGORY_NOT_FOUND);
        }
        List<RecipeCategory> recipeCategories = searchedCategories.stream()
                .map(category -> new RecipeCategory(searchedRecipe, category))
                .toList();

        recipeIngredientRepository.saveAll(ingredients);
        recipeStepRepository.saveAll(steps);
        recipeTagRepository.saveAll(tags);
        recipeCategoryRepository.saveAll(recipeCategories);

        return searchedRecipe;
    }
}
