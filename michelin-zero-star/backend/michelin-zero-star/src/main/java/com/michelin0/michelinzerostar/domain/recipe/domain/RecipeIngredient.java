package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.michelin0.michelinzerostar.global.domain.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "recipe_ingredients")
@Entity
public class RecipeIngredient extends BaseDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_ingredients_id")
    private Long ingredientsId;

    @Column(name = "name", nullable = false)
    private String ingredientName;

    @Column(nullable = false)
    private String amount;

    @ManyToOne
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    public RecipeIngredient(String ingredientName, String amount, Recipe recipe) {
        this.ingredientName = ingredientName;
        this.amount = amount;
        this.recipe = recipe;
    }
}
