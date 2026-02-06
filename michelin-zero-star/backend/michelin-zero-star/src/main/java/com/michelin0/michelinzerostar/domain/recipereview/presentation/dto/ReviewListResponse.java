package com.michelin0.michelinzerostar.domain.recipereview.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipereview.application.command.RecipeReviewListResult;
import java.time.LocalDateTime;

public record ReviewListResponse(
        Long userId,
        String nickName,
        String userProfileImage,
        Long reviewId,
        LocalDateTime reviewCreateDate,
        Double rating,
        String content,
        Boolean isMine,
        Double totalStar
) {

    public static ReviewListResponse from(RecipeReviewListResult result) {
        return new ReviewListResponse(
                result.userId(),
                result.nickName(),
                result.userProfileImage(),
                result.reviewId(),
                result.reviewCreateDate(),
                result.rating(),
                result.content(),
                result.isMine(),
                result.totalStar()
        );
    }
}
