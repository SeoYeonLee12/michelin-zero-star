package com.michelin0.michelinzerostar.domain.recipereview.application.command;

import com.michelin0.michelinzerostar.domain.recipereview.domain.projection.RecipeReviewListProjection;
import java.time.LocalDateTime;

public record RecipeReviewListResult(
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

    public static RecipeReviewListResult from(RecipeReviewListProjection projection) {
        return new RecipeReviewListResult(
                projection.userId(),
                projection.nickName(),
                projection.userProfileImage(),
                projection.reviewId(),
                projection.reviewCreateDate(),
                projection.rating(),
                projection.content(),
                projection.isMine(),
                projection.totalStar()
        );
    }
}
