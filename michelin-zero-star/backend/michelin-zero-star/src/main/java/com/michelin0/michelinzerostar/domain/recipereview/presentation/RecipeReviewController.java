package com.michelin0.michelinzerostar.domain.recipereview.presentation;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.recipereview.application.RecipeReviewService;
import com.michelin0.michelinzerostar.domain.recipereview.application.command.RecipeReviewCommand;
import com.michelin0.michelinzerostar.domain.recipereview.presentation.dto.RecipeReviewSaveRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class RecipeReviewController {

    private final RecipeReviewService recipeReviewService;

    @PostMapping
    public ResponseEntity<RecipeReviewSaveResponse> registerReview(
            @RequestBody @Valid RecipeReviewSaveRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long userId = userPrincipal.getId();
        RecipeReviewCommand command = new RecipeReviewCommand(
                userId,
                request.recipeId(),
                request.content(),
                request.rating()
        );
        Long recipeId = recipeReviewService.saveRecipeReview(command);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RecipeReviewSaveResponse(recipeId));
    }
}
