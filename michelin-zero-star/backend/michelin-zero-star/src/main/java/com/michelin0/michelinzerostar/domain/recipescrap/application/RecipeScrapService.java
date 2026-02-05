package com.michelin0.michelinzerostar.domain.recipescrap.application;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.recipescrap.domain.ScrapStatusChange;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecipeScrapService {

    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final ScrapStatusChange scrapSave;

    public boolean toggleScrap(Long userId, Long recipeId) {
        User user = userRepository.getById(userId);
        Recipe recipe = recipeRepository.getById(recipeId);
        return scrapSave.isScrapped(user, recipe);
    }
}
