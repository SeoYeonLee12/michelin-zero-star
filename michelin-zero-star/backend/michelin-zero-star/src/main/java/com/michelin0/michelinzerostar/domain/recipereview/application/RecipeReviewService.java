package com.michelin0.michelinzerostar.domain.recipereview.application;

import com.michelin0.michelinzerostar.domain.cookinglog.domain.CookingLogRepository;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.recipereview.application.command.RecipeReviewCommand;
import com.michelin0.michelinzerostar.domain.recipereview.domain.RecipeReview;
import com.michelin0.michelinzerostar.domain.recipereview.domain.RecipeReviewRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeReviewErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecipeReviewService {

    private final RecipeReviewRepository recipeReviewRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final CookingLogRepository cookingLogRepository;

    @Transactional
    public Long saveRecipeReview(RecipeReviewCommand command) {
        User searchedUser = userRepository.getById(command.userId());
        Recipe searchedRecipe = recipeRepository.getById(command.recipeId());
        if (!cookingLogRepository.existsByUserAndRecipe(searchedUser, searchedRecipe)) {
            throw new GlobalException(RecipeReviewErrorCode.REVIEW_NOT_CREATED);
        }
        RecipeReview newRecipeReview = new RecipeReview(
                searchedUser,
                searchedRecipe,
                command.rating(),
                command.content()
        );
        recipeReviewRepository.save(newRecipeReview);
        int totalReviews = recipeReviewRepository.countAllByRecipe(searchedRecipe);
        searchedRecipe.updateAverageRating(command.rating(), totalReviews);
        return command.recipeId();
    }
}
