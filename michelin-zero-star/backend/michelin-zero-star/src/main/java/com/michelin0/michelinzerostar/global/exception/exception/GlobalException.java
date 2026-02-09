package com.michelin0.michelinzerostar.global.exception.exception;

import com.michelin0.michelinzerostar.global.exception.errorcode.ErrorCode;
import lombok.Getter;

/***
 * 비즈니스 로직에서 의도적으로 예외를 발생시킬 때 사용하는 커스텀 예외 클래스
 * RuntimeException을 상속받으며, 생성자로 ErrorCode를 받아 어떤 종류의 에러인지 명시
 */
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
