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
    ALREADY_ASSIGNED_TAG(HttpStatus.CONFLICT, "RC006", "레시피를 할당할 수 없습니다."),
    ALREADY_ASSIGNED_CATEGORY(HttpStatus.CONFLICT, "RC007", "레시피를 할당할 수 없습니다."),
    ALREADY_ASSIGNED_RECIPE_CATEGORY(HttpStatus.CONFLICT, "RC008", "레시피에 카테고리를 할당할 수 없습니다."),
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "RC009", "카테고리를 찾을 수 없습니다."),
    RECIPE_NOT_FOUND(HttpStatus.NOT_FOUND, "RC010", "레시피를 찾을 수 없습니다."),
    RECIPE_NOT_FOUND_FOR_INGREDIENT(HttpStatus.NOT_FOUND, "RC011", "래시피가 할당 되어 있지 않습니다."),
    RECIPE_ID_NOT_MATCH(HttpStatus.BAD_REQUEST, "RC012", "요청하신 재료의 레시피 정보가 현재 레시피와 일치하지 않습니다."),
    RECIPE_NOT_FOUND_FOR_TAG(HttpStatus.BAD_REQUEST, "RC013",
            "요청하신 태그의 레시피 정보가 현재 레시피와 일치하지 않습니다."),
    RECIPE_NOT_FOUND_FOR_STEP(HttpStatus.BAD_REQUEST, "RC014",
            "요청하신 단계의 레시피 정보가 현재 레시피 정보와 일치하지 않습니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "RC015", "권한이 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;


}
