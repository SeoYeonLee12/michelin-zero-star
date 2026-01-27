package com.michelin0.michelinzerostar.domain.recipe.presentation;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.recipe.application.RecipeService;
import com.michelin0.michelinzerostar.domain.recipe.application.command.CookModeCommand;
import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeDetailCommand;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.CookModeDetailResponse;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.request.RecipeRegisterRequest;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.RecipeDetailResponse;
import com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response.RecipeRegisterResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @PostMapping
    public ResponseEntity<RecipeRegisterResponse> enrolledRecipes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody @Valid RecipeRegisterRequest recipeRegisterRequest
    ) {
        Long recipeId = recipeService.saveRecipe(
                recipeRegisterRequest.toCommand(principal.getId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(new RecipeRegisterResponse(recipeId));

    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeDetailResponse> getDetailRecipe(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserPrincipal principle
    ) {
        Long currentUserId = (principle != null) ? principle.getId() : null;
        RecipeDetailCommand command = recipeService.getDetailRecipe(recipeId, currentUserId);
        RecipeDetailResponse response = RecipeDetailResponse.from(command);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PutMapping("/{recipeId}")
    public ResponseEntity<RecipeRegisterResponse> modifyRecipe(
            @AuthenticationPrincipal UserPrincipal principle,
            @PathVariable Long recipeId,
            @RequestBody @Valid RecipeRegisterRequest recipeRegisterRequest
    ) {
        Long currentUserId = (principle != null) ? principle.getId() : null;
        Long response = recipeService.updateRecipe(
                recipeRegisterRequest.toCommand(currentUserId, recipeId));
        return ResponseEntity.status(HttpStatus.OK).body(new RecipeRegisterResponse(response));
    }

    @DeleteMapping("/{recipeId}")
    public ResponseEntity<Void> deleteRecipe(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long currentUserId = (principal != null) ? principal.getId() : null;
        recipeService.deleteRecipe(recipeId, currentUserId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/{recipeId}/cooking")
    public ResponseEntity<CookModeDetailResponse> getCookModeDetails(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserPrincipal principle
    ) {
        Long currentUserId = (principle != null) ? principle.getId() : null;
        CookModeCommand command = recipeService.getCookModeDetail(recipeId, currentUserId);
        CookModeDetailResponse response = CookModeDetailResponse.from(command);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
