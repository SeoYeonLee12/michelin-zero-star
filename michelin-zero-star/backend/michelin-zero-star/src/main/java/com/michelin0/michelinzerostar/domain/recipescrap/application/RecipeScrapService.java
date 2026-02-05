package com.michelin0.michelinzerostar.domain.recipescrap.application;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.recipescrap.application.result.UserRecipeScrapResult;
import com.michelin0.michelinzerostar.domain.recipescrap.domain.RecipeScrapQueryRepository;
import com.michelin0.michelinzerostar.domain.recipescrap.domain.ScrapStatusChange;
import com.michelin0.michelinzerostar.domain.recipescrap.domain.projection.ScrapRecipeListProjection;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecipeScrapService {

    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final ScrapStatusChange scrapSave;
    private final RecipeScrapQueryRepository recipeScrapQueryRepository;

    public boolean toggleScrap(Long userId, Long recipeId) {
        User user = userRepository.getById(userId);
        Recipe recipe = recipeRepository.getById(recipeId);
        return scrapSave.isScrapped(user, recipe);
    }

    public Page<UserRecipeScrapResult> getUserScrapRecipes(Long userId, Pageable pageable) {
        Page<ScrapRecipeListProjection> projections = recipeScrapQueryRepository.findAllByUserId(
                userId, pageable);
        return projections.map(UserRecipeScrapResult::from);
    }
}
