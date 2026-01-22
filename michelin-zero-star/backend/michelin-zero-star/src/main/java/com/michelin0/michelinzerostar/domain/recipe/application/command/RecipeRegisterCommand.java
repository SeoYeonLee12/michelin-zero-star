package com.michelin0.michelinzerostar.domain.recipe.application.command;

import com.michelin0.michelinzerostar.domain.recipe.domain.Nutrition;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeIngredient;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeTag;
import com.michelin0.michelinzerostar.domain.recipe.enums.RecipeType;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.List;

public record RecipeRegisterCommand(
        String title,
        String mainImageUrl,
        String recipeDescription,
        Integer cookTime,
        Integer servings,
        Long userId,
        // 영양 정보
        Double calorie,
        Double carbohydrate,
        Double protein,
        Double saturatedFat,
        Double cholesterol,
        Double sodium,
        Double calcium,
        List<RecipeStepRegisterCommand> steps,
        List<RecipeTagRegisterCommand> tags,
        List<RecipeIngredientRegisterCommand> ingredients
) {

    public Recipe toRecipe(User user) {
        Nutrition nutrition = new Nutrition(calorie, carbohydrate, protein, saturatedFat,
                cholesterol, sodium, calcium);
        return new Recipe(title, mainImageUrl, recipeDescription, cookTime, servings,
                RecipeType.USER, nutrition, user);
    }

    public List<RecipeStep> toSteps() {
        return this.steps.stream()
                .map(cmd -> new RecipeStep(
                        cmd.stepNumber(),
                        cmd.stepDescription(),
                        cmd.timerSeconds(),
                        cmd.stepImageUrl(),
                        cmd.cookingTip()
                ))
                .toList();
    }

    public List<RecipeIngredient> toIngredients() {
        return this.ingredients.stream()
                .map(cmd -> new RecipeIngredient(
                        cmd.ingredientName(),
                        cmd.ingredientAmount()
                ))
                .toList();
    }

    public List<RecipeTag> toTags() {
        return this.tags.stream()
                .map(cmd -> new RecipeTag(cmd.tagName()))
                .toList();
    }
}