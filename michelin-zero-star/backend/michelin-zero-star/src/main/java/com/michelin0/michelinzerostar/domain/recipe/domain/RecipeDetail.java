package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RecipeDetail {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
}
