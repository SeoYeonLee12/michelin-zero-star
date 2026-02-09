package com.michelin0.michelinzerostar.global.exception.response;

import com.michelin0.michelinzerostar.global.exception.errorcode.ErrorCode;
import java.util.Map;

/**
 * 입력값 검증(Validation) 실패 시 사용하는 상세 에러 응답 포맷입니다. 구조: 일반 에러 필드 + validationErrors (필드별 에러 메시지 Map)를
 * 포함
 */
public record MethodArgumentExceptionResponse(
        String code,
        String message,
        Map<String, String> validationErrors
) {

    public static MethodArgumentExceptionResponse from(
            ErrorCode code,
            Map<String, String> validationErrors
    ) {
        return new MethodArgumentExceptionResponse(
                code.getCode(),
                code.getMessage(),
                validationErrors
        );
    }
}
