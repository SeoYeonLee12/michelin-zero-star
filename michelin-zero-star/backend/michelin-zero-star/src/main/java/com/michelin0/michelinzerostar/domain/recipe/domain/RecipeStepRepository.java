package com.michelin0.michelinzerostar.domain.recipe.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeStepRepository extends JpaRepository<RecipeStep, Long> {

    void removeAllBy(Long recipeId);

    void deleteByRecipe(Recipe recipe);

    List<RecipeStep> findAllByRecipeOrderByStepNumberAsc(Recipe recipe);
}
