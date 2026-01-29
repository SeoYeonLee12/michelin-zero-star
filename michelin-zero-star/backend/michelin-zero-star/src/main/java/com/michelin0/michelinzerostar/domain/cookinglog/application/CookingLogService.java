package com.michelin0.michelinzerostar.domain.cookinglog.application;

import com.michelin0.michelinzerostar.domain.cookinglog.application.result.CookingCompleteResult;
import com.michelin0.michelinzerostar.domain.cookinglog.domain.CookingLogSave;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.starhistory.domain.RewardSaver;
import com.michelin0.michelinzerostar.domain.starhistory.domain.enums.StarHistoryType;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CookingLogService {

    private final CookingLogSave cookingLogSave;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final RewardSaver rewardSaver;

    public CookingCompleteResult saveCookingLog(Long userId, Long recipeId) {
        User user = userRepository.getById(userId);
        Recipe recipe = recipeRepository.getById(recipeId);
        long cookingLogId = cookingLogSave.saveCookingLog(user, recipe);
        double rewardCompleteAmount = recipe.getRewardCompleteAmount();
        StarHistoryType type = recipe.getRewardCompleteType();
        boolean isAwardedComplete = rewardSaver.tryAward(user, rewardCompleteAmount, type);
        return new CookingCompleteResult(cookingLogId, isAwardedComplete);
    }
}
