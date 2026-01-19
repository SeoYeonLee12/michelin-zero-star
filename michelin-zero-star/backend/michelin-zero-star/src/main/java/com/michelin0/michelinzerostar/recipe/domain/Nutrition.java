package com.michelin0.michelinzerostar.recipe.domain;


import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Nutrition {

    @Column(name = "calories", nullable = false)
    private Double calorie;

    @Column(nullable = false)
    private Double carbohydrate;

    @Column(nullable = false)
    private Double protein;

    @Column(name = "saturated_fat", nullable = false)
    private Double saturatedFat;

    @Column(nullable = false)
    private Double cholesterol;

    @Column(nullable = false)
    private Double sodium;

    @Column(nullable = false)
    private Double calcium;

    public Nutrition(
            Double calorie, Double carbohydrate, Double protein, Double saturatedFat,
            Double cholesterol, Double sodium, Double calcium
    ) {
        this.calorie = Objects.requireNonNullElse(calorie, 0.0);
        this.carbohydrate = Objects.requireNonNullElse(carbohydrate, 0.0);
        this.protein = Objects.requireNonNullElse(protein, 0.0);
        this.saturatedFat = Objects.requireNonNullElse(saturatedFat, 0.0);
        this.cholesterol = Objects.requireNonNullElse(cholesterol, 0.0);
        this.sodium = Objects.requireNonNullElse(sodium, 0.0);
        this.calcium = Objects.requireNonNullElse(calcium, 0.0);
    }
}
