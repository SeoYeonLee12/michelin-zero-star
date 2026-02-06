package com.michelin0.michelinzerostar.domain.recipereview.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeReviewErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewModify {

    private final RecipeReviewRepository recipeReviewRepository;

    public Recipe modifyReview(
            User user,
            Recipe recipe,
            RecipeReview recipeReview,
            String newContent,
            Double newRating
    ) {
        // 내가 쓴 댓글인지
        if (!recipeReview.getUser().getId().equals(user.getId())) {
            throw new GlobalException(RecipeReviewErrorCode.NOT_MATCH_WRITER);
        }
        // 해당 레시피에 달린 댓글이 맞는지
        if (!recipeReview.getRecipe().getRecipeId().equals(recipe.getRecipeId())) {
            throw new GlobalException(RecipeReviewErrorCode.NOT_MATCH_RECIPE);
        }
        if (!Objects.equals(recipeReview.getRating(), newRating)) {
            int totalReviews = recipeReviewRepository.countAllByRecipe(recipe);
            recipe.recalculateAverageRating(
                    recipeReview.getRating(),
                    newRating,
                    totalReviews
            );
        }
        recipeReview.updateRatingAndContent(newRating, newContent);
        return recipe;
    }
}
