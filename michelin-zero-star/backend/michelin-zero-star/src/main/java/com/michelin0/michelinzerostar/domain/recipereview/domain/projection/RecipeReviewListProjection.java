package com.michelin0.michelinzerostar.domain.recipereview.domain.projection;

import java.time.LocalDateTime;

public record RecipeReviewListProjection(
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

}
