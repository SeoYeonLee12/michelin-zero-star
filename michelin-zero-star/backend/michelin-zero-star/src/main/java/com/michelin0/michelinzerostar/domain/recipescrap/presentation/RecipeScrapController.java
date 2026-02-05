package com.michelin0.michelinzerostar.domain.recipescrap.presentation;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.recipescrap.application.RecipeScrapService;
import com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto.RecipeScrapRequest;
import com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto.RecipeScrapResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
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
}
