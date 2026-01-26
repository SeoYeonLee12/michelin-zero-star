package com.michelin0.michelinzerostar.domain.recipe.presentation;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.recipe.application.RecipeService;
import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeDetailCommand;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.request.RecipeRegisterRequest;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.RecipeDetailResponse;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.RecipeRegisterResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @PostMapping
    public ResponseEntity<RecipeRegisterResponse> enrolledRecipes(
            @AuthenticationPrincipal UserPrincipal userPrincipal, // ★ [수정] 타입 변경
            @RequestBody @Valid RecipeRegisterRequest recipeRegisterRequest
    ) {
        Long recipeId = recipeService.saveRecipe(
                recipeRegisterRequest.toCommand(userPrincipal.getId()));

        return ResponseEntity.status(HttpStatus.CREATED).body(new RecipeRegisterResponse(recipeId));
    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeDetailResponse> getDetailRecipe(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserPrincipal userPrincipal // ★ [수정] 타입 변경
    ) {
        Long currentUserId = (userPrincipal != null) ? userPrincipal.getId() : null;

        RecipeDetailCommand command = recipeService.getDetailRecipe(recipeId, currentUserId);
        RecipeDetailResponse response = RecipeDetailResponse.from(command);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}