package com.michelin0.michelinzerostar.domain.cookinglog.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.starhistory.domain.StarHistory;
import com.michelin0.michelinzerostar.domain.starhistory.domain.StarHistoryRepository;
import com.michelin0.michelinzerostar.domain.starhistory.domain.enums.StarHistoryType;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.exception.errorcode.CookingLogErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CookingLogSave {

    private final CookingLogRepository cookingLogRepository;
    private final StarHistoryRepository starHistoryRepository;

    public Long saveCookingLog(User user, Recipe recipe) {
        if (cookingLogRepository.existsByUserAndRecipe(user, recipe)) {
            throw new GlobalException(CookingLogErrorCode.ALREADY_EXISTS_LOG);
        }

        CookingLog newCookingLog = new CookingLog(user, recipe);
        cookingLogRepository.save(newCookingLog);
        // TODO 의심스러운 코드 햄에게 물어보기
        Double rewardCompleteAmount = recipe.getRewardCompleteAmount();

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        long todayRewardCount = starHistoryRepository.countByUserAndCreatedAtBetween(
                user, startOfDay, endOfDay);
        if (user.validAwardReward(todayRewardCount)) {
            user.awardComplete(rewardCompleteAmount);
        }

        StarHistory newStarHistory = new StarHistory(user, StarHistoryType.COOK_COMPLETE,
                rewardCompleteAmount);
        starHistoryRepository.save(newStarHistory);
        return newCookingLog.getCookingLogId();
    }
}
