package com.michelin0.michelinzerostar.global.exception.exception;

import com.michelin0.michelinzerostar.global.exception.errorcode.ErrorCode;
import lombok.Getter;

@Getter
public class GlobalException extends RuntimeException {

    private final ErrorCode code;

    public GlobalException(ErrorCode code) {
        super("Exception: %s, Code: %s, Message: %s".formatted(
                code,
                code.getCode(),
                code.getMessage()
        ));
        this.code = code;
    }
}
