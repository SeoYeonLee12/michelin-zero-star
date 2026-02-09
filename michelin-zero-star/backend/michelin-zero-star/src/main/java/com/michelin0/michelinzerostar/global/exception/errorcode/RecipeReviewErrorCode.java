package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum RecipeReviewErrorCode implements ErrorCode {
    REVIEW_NOT_CREATED(HttpStatus.BAD_REQUEST, "RRV002", "요리를 완료하지 않아 리뷰 등록이 불가합니다."),
    CONTENT_IS_NULL(HttpStatus.BAD_REQUEST, "RRV001", "리뷰 내용이 비어있습니다."),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "RC003", "리뷰를 찾을 수 없습니다."),
    NOT_MATCH_WRITER(HttpStatus.BAD_REQUEST, "RCC004", "해당 유저가 작성한 리뷰가 아닙니다."),
    NOT_MATCH_RECIPE(HttpStatus.BAD_REQUEST, "RCC005", "해당 레시피에 등록된 댓글이 아닙니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
