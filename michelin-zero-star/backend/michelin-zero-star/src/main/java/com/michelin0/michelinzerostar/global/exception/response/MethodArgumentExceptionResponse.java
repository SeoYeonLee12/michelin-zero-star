package com.michelin0.michelinzerostar.global.exception.response;

import com.michelin0.michelinzerostar.global.exception.errorcode.ErrorCode;
import java.util.Map;

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
