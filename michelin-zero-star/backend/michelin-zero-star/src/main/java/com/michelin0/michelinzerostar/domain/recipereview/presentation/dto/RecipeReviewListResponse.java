package com.michelin0.michelinzerostar.domain.recipereview.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.PageInfo;
import com.michelin0.michelinzerostar.domain.recipereview.application.command.RecipeReviewListResult;
import java.util.List;
import org.springframework.data.domain.Page;

public record RecipeReviewListResponse(
        List<ReviewListResponse> reviews,
        PageInfo pageInfo
) {

    public static RecipeReviewListResponse from(Page<RecipeReviewListResult> page) {
        List<ReviewListResponse> content = page.getContent().stream()
                .map(ReviewListResponse::from)
                .toList();
        PageInfo pageInfo = new PageInfo(
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()
        );
        return new RecipeReviewListResponse(content, pageInfo);
    }

}
