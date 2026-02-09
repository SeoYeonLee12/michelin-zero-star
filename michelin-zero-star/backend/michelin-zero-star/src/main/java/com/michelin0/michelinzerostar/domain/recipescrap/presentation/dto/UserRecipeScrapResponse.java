package com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.PageInfo;
import com.michelin0.michelinzerostar.domain.recipescrap.application.result.UserRecipeScrapResult;
import java.util.List;
import org.springframework.data.domain.Page;

public record UserRecipeScrapResponse(
        List<ScrapListResponse> recipes,
        PageInfo pageInfo
) {

    public static UserRecipeScrapResponse from(Page<UserRecipeScrapResult> result) {
        List<ScrapListResponse> response = result.getContent().stream()
                .map(ScrapListResponse::from)
                .toList();
        PageInfo pageInfo = new PageInfo(
                result.getNumber() + 1,
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext(),
                result.hasPrevious()
        );
        return new UserRecipeScrapResponse(response, pageInfo);
    }
}
