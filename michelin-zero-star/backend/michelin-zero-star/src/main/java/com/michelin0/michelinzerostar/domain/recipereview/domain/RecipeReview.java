package com.michelin0.michelinzerostar.domain.recipereview.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.BaseDomain;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeReviewErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "recipe_reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipeReview extends BaseDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_reviews_id")
    private Long reviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "recipes_id", nullable = false)
    private Recipe recipe;

    @Column(name = "rating", nullable = false)
    private Double rating;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    public RecipeReview(User user, Recipe recipe, Double rating, String content) {
        isContentNull(content);
        this.user = user;
        this.recipe = recipe;
        this.rating = rating == null ? 0.0 : rating;
        this.content = content;
    }

    private void isContentNull(String content) {
        if (content == null) {
            throw new GlobalException(RecipeReviewErrorCode.CONTENT_IS_NULL);
        }
    }
}
