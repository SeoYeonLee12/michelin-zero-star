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
public class RecipeRegister {

    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository ingredientRepository;
    private final RecipeStepRepository stepRepository;
    private final RecipeTagRepository tagRepository;
    private final RecipeCategoryRepository recipeCategoryRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public Long registerRecipe(Recipe recipe,
            List<RecipeStep> steps,
            List<RecipeTag> tags,
            List<RecipeIngredient> ingredients,
            List<Long> categoryIds
    ) {
        if (recipeRepository.existsByUserIdAndTitle(recipe.getUser().getId(), recipe.getTitle())) {
            throw new GlobalException(RecipeErrorCode.RECIPE_ALREADY_EXISTS);
        }

        Recipe savedRecipe = recipeRepository.save(recipe);

        recipe.registerIngredients(ingredients);
        recipe.registerSteps(steps);
        recipe.registerTags(tags);

        List<Category> searchedCategories = categoryRepository.findAllById(categoryIds);
        if (searchedCategories.size() != categoryIds.size()) {
            throw new GlobalException(RecipeErrorCode.CATEGORY_NOT_FOUND);
        }
        List<RecipeCategory> recipeCategories = searchedCategories.stream()
                .map(category -> new RecipeCategory(savedRecipe, category))
                .toList();

        ingredientRepository.saveAll(ingredients);
        stepRepository.saveAll(steps);
        tagRepository.saveAll(tags);
        recipeCategoryRepository.saveAll(recipeCategories);

        return savedRecipe.getRecipeId();
    }
}