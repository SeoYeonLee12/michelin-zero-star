package com.michelin0.michelinzerostar.domain.category.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface RecipeCategoryRepository extends JpaRepository<RecipeCategory, Long> {

    @Modifying
    @Transactional
    void deleteAllByRecipeRecipeId(Long recipeId);

    @Modifying
    @Transactional
    void deleteByRecipe(Recipe recipe);
}