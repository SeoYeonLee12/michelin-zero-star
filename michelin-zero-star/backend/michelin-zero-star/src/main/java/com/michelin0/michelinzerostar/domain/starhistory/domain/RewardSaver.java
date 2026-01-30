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
        long todayRewardCount = starHistoryRepository.countByUserAndDateBetween(user);
        if (user.validAwardReward(todayRewardCount)) {
            user.awardComplete(rewardAmount);
            StarHistory newStarHistory = new StarHistory(user, type, rewardAmount);
            starHistoryRepository.save(newStarHistory);
            return true;
        }
        return false;
    }
}
