package com.michelin0.michelinzerostar.domain.recipescrap.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ScrapStatusChange {

    private final RecipeScrapRepository recipeScrapRepository;

    public boolean isScrapped(User user, Recipe recipe) {
        return recipeScrapRepository.findByUserAndRecipe(user, recipe)
                .map(existingScrap -> {
                    recipeScrapRepository.delete(existingScrap);
                    return false;
                })
                .orElseGet(() -> {
                            RecipeScrap newScrap = new RecipeScrap(user, recipe);
                            recipeScrapRepository.save(newScrap);
                            return true;
                        }
                );
    }

}
