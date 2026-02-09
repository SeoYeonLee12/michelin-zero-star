package com.michelin0.michelinzerostar.domain.recipereview.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeReviewErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeReviewRepository extends CrudRepository<RecipeReview, Long> {

    int countAllByRecipe(Recipe recipe);

    default RecipeReview getById(Long reviewId) {
        return findByReviewId(reviewId)
                .orElseThrow(() -> new GlobalException(RecipeReviewErrorCode.REVIEW_NOT_FOUND));
    }

    Optional<RecipeReview> findByReviewId(Long reviewId);
}
