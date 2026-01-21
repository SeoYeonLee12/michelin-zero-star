package com.michelin0.michelinzerostar.domain.recipe.domain;

import com.michelin0.michelinzerostar.global.domain.BaseDomain;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
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
@Table(name = "recipe_tags")
@Entity
public class RecipeTag extends BaseDomain {

    @Id
    @Column(name = "recipe_tags_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tagId;

    @ManyToOne
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(name = "tag_name", nullable = false)
    private String tagName;

    public RecipeTag(Recipe recipe, String tagName) {
        this.recipe = recipe;
        this.tagName = tagName;
    }

    public void assignToRecipe(Recipe recipe) {
        if (this.recipe != null) {
            throw new GlobalException(RecipeErrorCode.ALREADY_ASSIGNED_TAG);
        }
        this.recipe = recipe;
    }
}
