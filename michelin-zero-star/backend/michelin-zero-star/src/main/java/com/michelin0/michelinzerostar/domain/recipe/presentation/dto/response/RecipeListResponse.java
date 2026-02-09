package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeListCommand;
import java.util.List;
import org.springframework.data.domain.Page;

public record RecipeListResponse(
        List<RecipesResponse> recipes,
        PageInfo pageInfo
) {

    public static RecipeListResponse from(Page<RecipeListCommand> page) {
        List<RecipesResponse> content = page.getContent().stream()
                .map(RecipesResponse::from)
                .toList();
        PageInfo pageInfo = new PageInfo(
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()
        );
        return new RecipeListResponse(content, pageInfo);
    }
}