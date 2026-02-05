package com.michelin0.michelinzerostar.domain.starhistory.domain;

import com.michelin0.michelinzerostar.domain.starhistory.domain.enums.StarHistoryType;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RewardSaver {

    private final StarHistoryRepository starHistoryRepository;

    public boolean tryAward(User user, double rewardAmount, StarHistoryType type) {
        double todayRewardSum = starHistoryRepository.sumRewardAmountByUserAndDateBetween(user);
        if (user.validAwardReward(todayRewardSum, rewardAmount)) {
            user.awardComplete(rewardAmount);
            StarHistory newStarHistory = new StarHistory(user, type, rewardAmount);
            starHistoryRepository.save(newStarHistory);
            return true;
        }
        return false;
    }
}
