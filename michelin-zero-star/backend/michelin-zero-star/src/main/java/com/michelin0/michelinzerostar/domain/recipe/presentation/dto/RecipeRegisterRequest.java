package com.michelin0.michelinzerostar.domain.recipe.presentation.dto;

import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeRegisterCommand;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.URL;

public record RecipeRegisterRequest(
        @NotBlank(message = "레시피명을 입력하세요.")
        String title,
        @NotBlank
        @URL(message = "URL 형식이 아닙니다.")
        String mainImageUrl,
        @NotBlank(message = "설명을 입력하세요.")
        String description,
        @NotBlank(message = "전체 요리 시간을 입력하세요.")
        Integer cookTime,
        @Min(value = 1)
        @NotNull(message = "인분 수를 입력하세요.")
        Integer servings,
        @NotNull
        Long userId,
        Double calorie,
        Double carbohydrate,
        Double protein,
        Double saturatedFat,
        Double cholesterol,
        Double sodium,
        Double calcium,
        @NotBlank(message = "재료 명을 입력하세요.")
        String ingredientName,
        @NotBlank(message = "재료 양을 입력하세요.")
        String ingredientAmount,
        @NotBlank(message = "태그를 입력하세요.")
        String tagName,
        @NotBlank(message = "단계 번호를 입력하세요.")
        Integer stepNumber,
        @NotBlank(message = "단계를 설명해주세요.")
        String stepDescription,
        @NotBlank(message = "현재 단계의 소요 시간(분)을 입력해주세요.")
        Integer timerSeconds,
        @NotBlank(message = "현재 단계의 이미지를 등록해주세요.")
        String stepImageUrl,
        String cookingTip

) {

    public RecipeRegisterCommand toCommand() {
        return new RecipeRegisterCommand;
    }

}
