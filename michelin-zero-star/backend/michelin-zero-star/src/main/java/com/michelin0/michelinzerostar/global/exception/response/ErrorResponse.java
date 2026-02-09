package com.michelin0.michelinzerostar.global.exception.response;

import com.michelin0.michelinzerostar.global.exception.errorcode.ErrorCode;

/**
 * 일반적인 에러 응답 포맷 구조: { "code": "ISE1", "message": "알 수 없는..." } 형태의 JSON을 생성
 */

public record ErrorResponse(
        String code,
        String message
) {

    public static ErrorResponse from(ErrorCode code) {
        return new ErrorResponse(code.getCode(), code.getMessage());
    }

}
