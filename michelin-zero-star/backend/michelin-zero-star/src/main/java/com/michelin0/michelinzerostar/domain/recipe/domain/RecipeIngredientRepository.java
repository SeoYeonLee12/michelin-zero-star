package com.michelin0.michelinzerostar.domain.recipe.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    @Modifying
    @Transactional
    void deleteAllByRecipeRecipeId(Long recipeId);

    void deleteByRecipe(Recipe recipe);
}