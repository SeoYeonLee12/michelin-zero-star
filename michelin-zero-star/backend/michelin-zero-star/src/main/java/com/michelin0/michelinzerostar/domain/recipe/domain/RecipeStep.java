package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
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

@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Table(name = "recipe_steps")
@Entity
public class RecipeStep {

    @Id
    @Column(name = "recipe_steps_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recipeStepId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipes_id", nullable = false)
    private Recipe recipe;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String stepDescription;

    @Column(name = "timer_seconds", nullable = false)
    private Integer timerSeconds;

    @Column(name = "media_url", nullable = false)
    private String stepImageUrl;

    @Column(name = "tip", columnDefinition = "TEXT")
    private String cookingTip;

    public RecipeStep(Integer stepNumber, String stepDescription,
            Integer timerSeconds, String stepImageUrl, String cookingTip) {
        this.stepNumber = stepNumber;
        this.stepDescription = stepDescription;
        this.timerSeconds = timerSeconds;
        this.stepImageUrl = stepImageUrl;
        this.cookingTip = cookingTip;
    }

    public void assignToRecipe(Recipe recipe) {
        if (this.recipe != null) {
            throw new GlobalException(RecipeErrorCode.ALREADY_ASSIGNED_STEP);
        }
        this.recipe = recipe;
    }

    public void unassignToRecipe() {
        if (this.recipe == null) {
            throw new GlobalException(RecipeErrorCode.RECIPE_NOT_FOUND_FOR_STEP);
        }
        this.recipe = null;
    }
}
