package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum RecipeErrorCode implements ErrorCode {

    RECIPE_ALREADY_EXISTS(HttpStatus.CONFLICT, "RC001", "이미 등록된 레시피입니다."),
    INVALID_INGREDIENT(HttpStatus.BAD_REQUEST, "RC002", "올바르지 않은 재료 형식입니다."),
    INVALID_STEP(HttpStatus.BAD_REQUEST, "RC003", "올바르지 않은 단계 형식입니다."),
    INVALID_TAG(HttpStatus.BAD_REQUEST, "RC003", "올바르지 않은 태그입니다."),
    ALREADY_ASSIGNED_INGREDIENT(HttpStatus.CONFLICT, "RC004", "레시피를 할당할 수 없습니다."),
    ALREADY_ASSIGNED_STEP(HttpStatus.CONFLICT, "RC005", "레시피를 할당할 수 없습니다."),
    ALREADY_ASSIGNED_TAG(HttpStatus.CONFLICT, "RC006", "레시피를 할당할 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;


}
