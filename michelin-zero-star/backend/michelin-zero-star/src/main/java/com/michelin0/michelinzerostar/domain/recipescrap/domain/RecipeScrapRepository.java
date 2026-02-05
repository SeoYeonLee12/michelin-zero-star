package com.michelin0.michelinzerostar.domain.recipescrap.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeScrapRepository extends JpaRepository<RecipeScrap, Long> {

    boolean existsByUserAndRecipe(User user, Recipe recipe);

    Optional<RecipeScrap> findByUserAndRecipe(User user, Recipe recipe);
}
