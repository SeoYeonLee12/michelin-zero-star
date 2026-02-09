package com.michelin0.michelinzerostar.domain.cookinglog.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CookingLogSave {

    private final CookingLogRepository cookingLogRepository;

    public Long saveCookingLog(User user, Recipe recipe) {
        CookingLog newCookingLog = new CookingLog(user, recipe);
        cookingLogRepository.save(newCookingLog);
        return newCookingLog.getCookingLogId();
    }
}
