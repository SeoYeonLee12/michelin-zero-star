package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum CookingLogErrorCode implements ErrorCode {
    ALREADY_EXISTS_LOG(HttpStatus.CONFLICT, "CL001", "이미 완료한 요리입니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
