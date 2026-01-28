package com.michelin0.michelinzerostar.domain.cookinglog.application;

import com.michelin0.michelinzerostar.domain.cookinglog.domain.CookingLogSave;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CookingLogService {

    private final CookingLogSave cookingLogSave;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;

    public Long saveCookingLog(Long userId, Long recipeId) {
        User user = userRepository.getById(userId);
        Recipe recipe = recipeRepository.getById(recipeId);
        log.info("[Service] Cooking log ID: " + recipeId);
        return cookingLogSave.saveCookingLog(user, recipe);
    }
}
