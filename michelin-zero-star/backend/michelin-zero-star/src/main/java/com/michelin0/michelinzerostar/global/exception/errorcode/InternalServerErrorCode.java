package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 내부 서버 오류나 공통적인 에러 상황을 정의한 구현체 UNKNOWN_EXCEPTION (알 수 없는 에러), INVALID_INPUT_VALUE (잘못된 입력값) 등 구체적인
 * 에러 상수들을 정의
 */
@Getter
@RequiredArgsConstructor
public enum InternalServerErrorCode implements ErrorCode {

    UNKNOWN_EXCEPTION(HttpStatus.INTERNAL_SERVER_ERROR, "ISE1", "알 수 없는 예외가 발생했습니다."),
    EXTERNAL_API_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "ISE2", "API 호출 중 예외가 발생했습니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "ISE3", "유효하지 않은 입력값입니다."),
    JSON_SERIALIZATION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "ISE4",
            "데이터 처리 중 JSON 변환 오류가 발생했습니다."),

    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
