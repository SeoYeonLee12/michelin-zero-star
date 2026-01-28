package com.michelin0.michelinzerostar.domain.cookinglog.application;

import com.michelin0.michelinzerostar.domain.cookinglog.domain.CookingLogSave;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CookingLogService {

    private final CookingLogSave cookingLogSave;

    public Long saveCookingLog(Long userId, Long recipeId) {
        log.info("[Service] Cooking log ID: " + recipeId);
        return cookingLogSave.saveCookingLog(recipeId, userId);
    }
}
