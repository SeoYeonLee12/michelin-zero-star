package com.michelin0.michelinzerostar.domain.recipe.presentation;

import com.michelin0.michelinzerostar.domain.recipe.application.RecipeService;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.RecipeRegisterRequest;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.RecipeRegisterResponse;
import com.michelin0.michelinzerostar.global.security.auth.CustomUserDetails;
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
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @PostMapping
    public ResponseEntity<RecipeRegisterResponse> enrolledRecipes(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody @Valid RecipeRegisterRequest recipeRegisterRequest) {
        Long recipeId = recipeService.saveRecipe(
                recipeRegisterRequest.toCommand(userDetails.getUser()
                        .getId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(new RecipeRegisterResponse(recipeId));

    }
}
