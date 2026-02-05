package com.michelin0.michelinzerostar.domain.recipescrap.presentation;

import com.michelin0.michelinzerostar.domain.recipescrap.application.RecipeScrapService;
import com.michelin0.michelinzerostar.domain.recipescrap.presentation.dto.RecipeScrapRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/scrap")
@RequiredArgsConstructor
public class RecipeScrapController {

    private final RecipeScrapService recipeScrapService;

    @PostMapping
    public ResponseEntity<Boolean> changeRecipeScrap(
            @RequestBody @Valid RecipeScrapRequest request) {

    }
}
