package com.michelin0.michelinzerostar.domain.recipescrap.presentation;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.recipescrap.application.RecipeScrapService;
import com.michelin0.michelinzerostar.domain.recipescrap.application.result.UserRecipeScrapResult;
import com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto.RecipeScrapRequest;
import com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto.RecipeScrapResponse;
import com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto.UserRecipeScrapResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/scraps")
@RequiredArgsConstructor
public class RecipeScrapController {

    private final RecipeScrapService recipeScrapService;

    @PostMapping
    public ResponseEntity<RecipeScrapResponse> changeScrapStatus(
            @RequestBody RecipeScrapRequest recipeScrapRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long userId = userPrincipal.getId();
        boolean isScrapped = recipeScrapService.toggleScrap(userId, recipeScrapRequest.recipeId());
        return ResponseEntity.status(HttpStatus.OK).body(new RecipeScrapResponse(isScrapped));
    }

    @GetMapping
    public ResponseEntity<UserRecipeScrapResponse> getUserScrapList(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(page = 0, size = 20) Pageable pageable
    ) {
        Long userId = userPrincipal.getId();
        Page<UserRecipeScrapResult> result = recipeScrapService.getUserScrapRecipes(userId,
                pageable);
        return ResponseEntity.status(HttpStatus.OK).body(UserRecipeScrapResponse.from(result));
    }
}
