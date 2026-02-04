package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    default Recipe getById(Long recipeId) {
        return findById(recipeId)
                .orElseThrow(() -> new GlobalException(RecipeErrorCode.RECIPE_NOT_FOUND));
    }

    Optional<Recipe> findById(Long recipeId);

    boolean existsByUserIdAndTitle(Long userId, String title);

    boolean existsByRecipeId(Long recipeId);
}
