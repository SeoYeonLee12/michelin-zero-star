package com.michelin0.michelinzerostar.domain.cookinglog.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CookingLogRepository extends JpaRepository<CookingLog, Long> {

    boolean existsByUserAndRecipe(User user, Recipe recipe);
}
