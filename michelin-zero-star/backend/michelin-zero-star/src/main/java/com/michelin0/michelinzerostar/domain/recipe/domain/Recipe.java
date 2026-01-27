package com.michelin0.michelinzerostar.domain.recipe.domain;

import static com.michelin0.michelinzerostar.global.SqlRestrictionClause.DELETED_AT_IS_NULL;

import com.michelin0.michelinzerostar.domain.recipe.enums.RecipeType;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.SoftDeleteDomain;
import com.michelin0.michelinzerostar.global.exception.errorcode.ErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@SQLRestriction(DELETED_AT_IS_NULL)
@SQLDelete(sql = "UPDATE recipes SET deleted_at = CURRENT_TIMESTAMP WHERE recipes_id = ?")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "recipes")
@Entity
public class Recipe extends SoftDeleteDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipes_id")
    private Long recipeId;

    @Column(nullable = false)
    private String title;

    @Column(name = "main_image_url", nullable = false)
    private String mainImageUrl;

    @Column(nullable = false)
    private String description;

    @Column(name = "cook_time", nullable = false)
    private Integer cookTime;

    @Column(nullable = false)
    private Integer servings;

    @Column(name = "scrap_count", nullable = false)
    private Integer scrapCount;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount;

    @Column(name = "average_rating", nullable = false)
    private Double averageRating;

    @Column(name = "recipe_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RecipeType recipeType;

    @ManyToOne
    @JoinColumn(name = "users_id", nullable = false)
    private User user;

    @Embedded
    private Nutrition nutrition;

    public Recipe(String title, String mainImageUrl, String description, Integer cookTime,
            Integer servings, RecipeType recipeType, Nutrition nutrition, User user
    ) {
        this.title = title;
        this.mainImageUrl = mainImageUrl;
        this.description = description;
        this.cookTime = cookTime;
        this.servings = servings;
        this.scrapCount = 0;
        this.reviewCount = 0;
        this.averageRating = 0.0;
        this.recipeType = (recipeType == null) ? RecipeType.USER : recipeType;
        this.nutrition = Objects.requireNonNullElse(nutrition,
                new Nutrition(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0));
        this.user = user;
    }

    public void updateRecipe(Recipe updatedRecipe) {
        this.title = updatedRecipe.getTitle();
        this.mainImageUrl = updatedRecipe.getMainImageUrl();
        this.description = updatedRecipe.getDescription();
        this.cookTime = updatedRecipe.getCookTime();
        this.servings = updatedRecipe.getServings();
        this.scrapCount = updatedRecipe.getScrapCount();
        this.reviewCount = updatedRecipe.getReviewCount();
        this.averageRating = updatedRecipe.getAverageRating();
        this.recipeType = updatedRecipe.getRecipeType();
        this.nutrition = updatedRecipe.getNutrition();
    }

    public void deleteIngredients(List<RecipeIngredient> recipeIngredients) {
        checkedBlank(recipeIngredients, RecipeErrorCode.INVALID_INGREDIENT);
        isMatchedRecipeId(recipeIngredients,
                RecipeIngredient::getRecipe,
                RecipeErrorCode.RECIPE_ID_NOT_MATCH
        );
        recipeIngredients.forEach(RecipeIngredient::unassignToRecipe);
    }

    public void deleteTags(List<RecipeTag> recipeTags) {
        checkedBlank(recipeTags, RecipeErrorCode.INVALID_TAG);
        isMatchedRecipeId(recipeTags,
                RecipeTag::getRecipe,
                RecipeErrorCode.RECIPE_ID_NOT_MATCH
        );
        recipeTags.forEach(RecipeTag::unassignToRecipe);
    }

    public void deleteSteps(List<RecipeStep> recipeSteps) {
        checkedBlank(recipeSteps, RecipeErrorCode.INVALID_STEP);
        isMatchedRecipeId(recipeSteps,
                RecipeStep::getRecipe,
                RecipeErrorCode.RECIPE_ID_NOT_MATCH
        );
        recipeSteps.forEach(RecipeStep::unassignToRecipe);
    }

    public void registerIngredients(List<RecipeIngredient> ingredients) {
        checkedBlank(ingredients, RecipeErrorCode.INVALID_INGREDIENT);
        ingredients.forEach(ing -> ing.assignToRecipe(this));
    }

    public void registerSteps(List<RecipeStep> steps) {
        checkedBlank(steps, RecipeErrorCode.INVALID_STEP);
        steps.forEach(step -> step.assignToRecipe(this));
    }

    public void registerTags(List<RecipeTag> tags) {
        checkedBlank(tags, RecipeErrorCode.INVALID_TAG);
        tags.forEach(tag -> tag.assignToRecipe(this));
    }

    public void validateRecipeEnrolledUser(Long userId) {
        if (!this.user.getId().equals(userId)) {
            throw new GlobalException(RecipeErrorCode.ACCESS_DENIED);
        }
    }
    private <T> void isMatchedRecipeId(
            List<T> list,
            Function<T, Recipe> recipeExtractor,
            ErrorCode matchError
    ) {
        boolean isMatched = list.stream()
                .map(recipeExtractor)
                .anyMatch(recipe -> !(recipe.getRecipeId().equals(this.recipeId))
                );
        if (isMatched) {
            throw new GlobalException(matchError);
        }
    }

    private <T> void checkedBlank(List<T> list, ErrorCode emptyError) {
        if (list == null || list.isEmpty()) {
            throw new GlobalException(emptyError);
        }
    }
}

