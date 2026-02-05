package com.michelin0.michelinzerostar.domain.recipescrap.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;


@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Table(
        name = "user_recipe_scraps",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_scrap_user_recipe",
                        columnNames = {"users_id", "recipes_id"}
                )
        }
)
@Entity
public class RecipeScrap extends BaseDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_recipe_scraps_id")
    private Long scrapId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "recipes_id", nullable = false)
    private Recipe recipe;

    public RecipeScrap(User user, Recipe recipe) {
        this.user = user;
        this.recipe = recipe;
    }
}
