package com.michelin0.michelinzerostar.domain.cookinglog.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.starhistory.domain.RewardSaver;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.exception.errorcode.CookingLogErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CookingLogSave {

    private final CookingLogRepository cookingLogRepository;
    private final RewardSaver rewardSaver;

    public Long saveCookingLog(User user, Recipe recipe) {
        if (cookingLogRepository.existsByUserAndRecipe(user, recipe)) {
            throw new GlobalException(CookingLogErrorCode.ALREADY_EXISTS_LOG);
        }
        CookingLog newCookingLog = new CookingLog(user, recipe);
        cookingLogRepository.save(newCookingLog);
        return newCookingLog.getCookingLogId();
    }
}
