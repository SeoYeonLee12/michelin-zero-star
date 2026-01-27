package com.michelin0.michelinzerostar.domain.cookinglog.application;

import com.michelin0.michelinzerostar.domain.cookinglog.domain.CookingLog;
import com.michelin0.michelinzerostar.domain.cookinglog.domain.CookingLogRepository;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.CookingLogErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CookingLogService {

    private final CookingLogRepository cookingLogRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;

    public Long saveCookingLog(Long userId, Long recipeId) {
        User user = userRepository.getById(userId);
        Recipe recipe = recipeRepository.getById(recipeId);
        if (cookingLogRepository.existsByUserAndRecipe(user, recipe)) {
            throw new GlobalException(CookingLogErrorCode.ALREADY_EXISTS_LOG);
        }
        CookingLog newCookingLog = new CookingLog(user, recipe);
        cookingLogRepository.save(newCookingLog);
        // TODO 도메인에서 별점 주는 로직 구현
        return newCookingLog.getCookingLogId();
    }
}
