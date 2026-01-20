package com.michelin0.michelinzerostar.domain.recipe.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
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

    @ManyToOne
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Lob
    @Column(name = "description", nullable = false)
    private String recipeDescription;

    @Column(name = "timer_seconds", nullable = false)
    private Integer timerSeconds;

    @Column(name = "media_url", nullable = false)
    private String stepImageUrl;

    @Lob
    @Column(name = "tip")
    private String cookingTip;

    public RecipeStep(Recipe recipe, Integer stepNumber, String recipeDescription,
            Integer timerSeconds, String stepImageUrl, String cookingTip) {
        this.recipe = recipe;
        this.stepNumber = stepNumber;
        this.recipeDescription = recipeDescription;
        this.timerSeconds = timerSeconds;
        this.stepImageUrl = stepImageUrl;
        this.cookingTip = cookingTip;
    }
}
