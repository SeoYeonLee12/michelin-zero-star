package com.michelin0.michelinzerostar.domain.recipe.presentation;

import com.michelin0.michelinzerostar.domain.recipe.application.RecipeService;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.request.RecipeRegisterRequest;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.RecipeDetailResponse;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.RecipeRegisterResponse;
import com.michelin0.michelinzerostar.global.security.auth.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @PostMapping
    public ResponseEntity<RecipeRegisterResponse> enrolledRecipes(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody @Valid RecipeRegisterRequest recipeRegisterRequest
    ) {
        Long recipeId = recipeService.saveRecipe(
                recipeRegisterRequest.toCommand(userDetails.getUser()
                        .getId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(new RecipeRegisterResponse(recipeId));

    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeDetailResponse> getDetailRecipe(
            @RequestParam Long recipeId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        //TODO 검증로직을 여기에 둬도 되나?
        Long currentUserId = (userDetails != null) ? userDetails.getUser().getId() : null;

//        RecipeDetailResponse response = RecipeService.findRecipeDetail(recipeId, currentUserId);
//        return ResponseEntity.status(HttpStatus.OK).body(response);
        return null;
    }
}
