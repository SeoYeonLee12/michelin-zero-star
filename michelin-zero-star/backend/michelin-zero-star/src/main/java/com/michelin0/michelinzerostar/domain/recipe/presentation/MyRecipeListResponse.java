package com.michelin0.michelinzerostar.domain.recipe.presentation;

import com.michelin0.michelinzerostar.domain.recipe.application.result.MyRecipeListResult;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.MyRecipesResponse;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.PageInfo;
import java.util.List;
import org.springframework.data.domain.Page;

public record MyRecipeListResponse(
        List<MyRecipesResponse> recipes,
        PageInfo pageInfo
) {

    public static MyRecipeListResponse from(Page<MyRecipeListResult> result) {
        List<MyRecipesResponse> response = result.getContent().stream()
                .map(MyRecipesResponse::from)
                .toList();
        PageInfo pageInfo = new PageInfo(
                result.getNumber() + 1,
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext(),
                result.hasPrevious()
        );
        return new MyRecipeListResponse(response, pageInfo);
    }
}
