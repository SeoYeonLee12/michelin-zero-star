package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum AiChatMessageErrorCode implements ErrorCode {
    ALREADY_ENROLLED_MESSAGE(HttpStatus.CONFLICT, "AiCM001", "이미 등록된 메세지입니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
