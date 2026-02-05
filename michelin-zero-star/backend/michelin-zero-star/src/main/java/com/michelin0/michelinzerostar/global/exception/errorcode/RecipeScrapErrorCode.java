package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum RecipeScrapErrorCode implements ErrorCode {
    ALREADY_EXISTS_SCRAP(HttpStatus.CONFLICT, "RSC001", "이미 스크랩한 레시피입니다."),
    SCRAP_NOT_FOUND(HttpStatus.NOT_FOUND, "RSC002", "해당 스크랩이 존재하지 않습니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
