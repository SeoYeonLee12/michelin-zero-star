package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum AiChatMessageErrorCode implements ErrorCode {
    ALREADY_ENROLLED_MESSAGE(HttpStatus.CONFLICT, "AiCM001", "이미 등록된 메세지입니다."),
    EMPTY_CONTENT(HttpStatus.BAD_GATEWAY, "AiCM002", "AI 응답이 비어있습니다."),
    EMPTY_AI_CLIENT_RESPONSE(HttpStatus.BAD_GATEWAY, "AiCM003", "AI 서버로부터 유효한 응답을 받지 못했습니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
