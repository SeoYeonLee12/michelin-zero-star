package com.michelin0.michelinzerostar.domain.cookinglog.presentation.dto;

import com.michelin0.michelinzerostar.domain.cookinglog.application.result.CookingCompleteResult;

public record CookingLogCompleteResponse(
        Long cookingLogId,
        boolean isAwardedCookingCompleteReward
) {

    public static CookingLogCompleteResponse from(CookingCompleteResult result) {
        return new CookingLogCompleteResponse(result.cookingLongId(),
                result.isAwardedCookingCompleteReward());
    }
}
