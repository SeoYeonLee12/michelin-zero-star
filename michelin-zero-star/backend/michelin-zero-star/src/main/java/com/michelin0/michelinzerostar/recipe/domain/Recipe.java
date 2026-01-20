package com.michelin0.michelinzerostar.recipe.domain;

import static com.michelin0.michelinzerostar.global.SqlRestrictionClause.DELETED_AT_IS_NULL;

import com.michelin0.michelinzerostar.global.domain.SoftDeleteDomain;
import com.michelin0.michelinzerostar.recipe.enums.RecipeType;
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
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@SQLRestriction(DELETED_AT_IS_NULL)
@SQLDelete(sql = "UPDATE recipes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
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
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Embedded
    private Nutrition nutrition;

    public Recipe(String title, String mainImageUrl, String description, Integer cookTime,
            Integer servings, RecipeType recipeType, Nutrition nutrition
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

    }


}

