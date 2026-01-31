package com.michelin0.michelinzerostar.domain.category.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeCategoryRepository extends JpaRepository<RecipeCategory, Long> {

    void removeAllBy(Long recipeId);

    void deleteByRecipe(Recipe recipe);
}
