package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum StarHistoryErrorCode implements ErrorCode {
    
    DAILY_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "SH001", "별을 적립 가능 횟수가 초과되었습니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
