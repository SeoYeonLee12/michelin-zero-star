package com.michelin0.michelinzerostar.domain.recipe.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeTagRepository extends JpaRepository<RecipeTag, Long> {

    void deleteByRecipe(Recipe recipe);
}