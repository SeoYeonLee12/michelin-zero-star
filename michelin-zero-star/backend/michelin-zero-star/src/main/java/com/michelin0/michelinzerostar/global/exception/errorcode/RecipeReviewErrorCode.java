package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum RecipeReviewErrorCode implements ErrorCode {
    REVIEW_NOT_CREATED(HttpStatus.BAD_REQUEST, "RRV002", "요리를 완료하지 않아 리뷰 등록이 불가합니다."),
    CONTENT_IS_NULL(HttpStatus.BAD_REQUEST, "RRV001", "리뷰 내용이 비어있습니다."),
    
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
