package com.michelin0.michelinzerostar.global.exception.errorcode;

import org.springframework.http.HttpStatus;

/**
 * 모든 에러 코드 Enum들이 구현해야 하는 표준 인터페이스 에러의 HTTP 상태 코드, 고유 식별 코드(String), 메시지를 반환하도록 강제하여 일관성을 유지
 */

public interface ErrorCode {

    HttpStatus getHttpStatus();

    String getCode();

    String getMessage();
}
