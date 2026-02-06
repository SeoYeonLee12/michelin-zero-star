package com.michelin0.michelinzerostar.domain.recipereview.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeReviewRepository extends CrudRepository<RecipeReview, Long> {

    int countAllByRecipe(Recipe recipe);
}
