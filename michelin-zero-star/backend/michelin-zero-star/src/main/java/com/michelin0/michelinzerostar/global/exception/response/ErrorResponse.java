package com.michelin0.michelinzerostar.global.exception.response;

import com.michelin0.michelinzerostar.global.exception.errorcode.ErrorCode;

public record ErrorResponse(
        String code,
        String message
) {

    public static ErrorResponse from(ErrorCode code) {
        return new ErrorResponse(code.getCode(), code.getMessage());
    }

}
