package com.michelin0.michelinzerostar.domain.recipereview.presentation;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.recipereview.application.RecipeReviewService;
import com.michelin0.michelinzerostar.domain.recipereview.application.command.RecipeReviewCommand;
import com.michelin0.michelinzerostar.domain.recipereview.application.command.RecipeReviewListResult;
import com.michelin0.michelinzerostar.domain.recipereview.application.command.RecipeReviewModifyCommand;
import com.michelin0.michelinzerostar.domain.recipereview.presentation.dto.RecipeReviewListResponse;
import com.michelin0.michelinzerostar.domain.recipereview.presentation.dto.RecipeReviewModifyRequest;
import com.michelin0.michelinzerostar.domain.recipereview.presentation.dto.RecipeReviewSaveRequest;
import com.michelin0.michelinzerostar.domain.recipereview.presentation.dto.RecipeReviewSaveResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api")
@RequiredArgsConstructor
public class RecipeReviewController {

    private final RecipeReviewService recipeReviewService;

    @PostMapping("/reviews")
    public ResponseEntity<RecipeReviewSaveResponse> registerReview(
            @RequestBody @Valid RecipeReviewSaveRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long userId = userPrincipal.getId();
        RecipeReviewCommand command = RecipeReviewCommand.of(userId, request);
        Long recipeId = recipeReviewService.saveRecipeReview(command);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RecipeReviewSaveResponse(recipeId));
    }

    @GetMapping("recipes/{recipeId}/reviews")
    public ResponseEntity<RecipeReviewListResponse> getRecipeReviews(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PageableDefault(page = 0, size = 20) Pageable pageable
    ) {
        Long userId = userPrincipal.getId();
        Page<RecipeReviewListResult> result = recipeReviewService.getReviewList(recipeId, userId,
                pageable);
        RecipeReviewListResponse response = RecipeReviewListResponse.from(result);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PutMapping("/recipes/{recipeId}/reviews/{reviewId}")
    public ResponseEntity<RecipeReviewSaveResponse> updateReview(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long recipeId,
            @PathVariable Long reviewId,
            @RequestBody @Valid RecipeReviewModifyRequest request
    ) {
        Long userId = userPrincipal.getId();
        Long findRecipeId = recipeReviewService
                .modifyRecipeReview(
                        userId,
                        recipeId,
                        reviewId,
                        RecipeReviewModifyCommand.from(request)
                );
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(new RecipeReviewSaveResponse(findRecipeId));
    }

    @DeleteMapping("/recipes/{recipeId}/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long recipeId,
            @PathVariable Long reviewId
    ) {
        Long userId = userPrincipal.getId();
        recipeReviewService.deleteRecipeReview(userId, recipeId, reviewId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
