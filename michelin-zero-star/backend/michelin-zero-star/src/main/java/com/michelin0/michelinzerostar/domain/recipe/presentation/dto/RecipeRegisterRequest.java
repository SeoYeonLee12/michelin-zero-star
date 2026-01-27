package com.michelin0.michelinzerostar.domain.recipe.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeIngredientRegisterCommand;
import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeRegisterCommand;
import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeStepRegisterCommand;
import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeTagRegisterCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.hibernate.validator.constraints.URL;

public record RecipeRegisterRequest(
        @NotBlank(message = "레시피명을 입력하세요.")
        String title,
        @NotBlank
        @URL(message = "URL 형식이 아닙니다.")
        String mainImageUrl,
        @NotBlank(message = "설명을 입력하세요.")
        String recipeDescription,
        @NotNull(message = "전체 요리 시간을 입력하세요.")
        Integer cookTime,
        @Min(value = 1)
        @NotNull(message = "인분 수를 입력하1세요.")
        Integer servings,
        Double calorie,
        Double carbohydrate,
        Double protein,
        Double saturatedFat,
        Double cholesterol,
        Double sodium,
        Double calcium,
        @Valid
        @NotEmpty(message = "재료는 필수입니다.")
        List<RecipeIngredientRegisterRequest> ingredients,
        @Valid
        @NotEmpty(message = "태그를 입력해주세요")
        List<RecipeTagRegisterRequest> tags,
        @Valid
        @NotEmpty(message = "단계를 입력해주세요.")
        List<RecipeStepRegisterRequest> steps,
        @NotNull(message = "카테고리는 하나 이상 선택해주세요.")
        List<Long> categoryIds
) {

    public RecipeRegisterCommand toCommand(Long userId) {

        List<RecipeIngredientRegisterCommand> ingredientCommands = ingredients.stream()
                .map(RecipeIngredientRegisterRequest::toCommand).toList();

        List<RecipeStepRegisterCommand> stepCommands = steps.stream()
                .map(RecipeStepRegisterRequest::toCommand).toList();

        List<RecipeTagRegisterCommand> tagCommands = tags.stream()
                .map(RecipeTagRegisterRequest::toCommand).toList();

        return new RecipeRegisterCommand(title, mainImageUrl, recipeDescription, cookTime, servings,
                userId, calorie, carbohydrate, protein, saturatedFat, cholesterol, sodium, calcium,
                stepCommands, tagCommands, ingredientCommands, categoryIds);
    }

}
