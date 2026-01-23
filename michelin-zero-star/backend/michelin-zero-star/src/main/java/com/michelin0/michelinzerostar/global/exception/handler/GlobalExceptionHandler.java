package com.michelin0.michelinzerostar.global.exception.handler;

import com.michelin0.michelinzerostar.global.exception.errorcode.ErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.InternalServerErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import com.michelin0.michelinzerostar.global.exception.response.ErrorResponse;
import com.michelin0.michelinzerostar.global.exception.response.MethodArgumentExceptionResponse;
import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * RuntimeException을 상속받으며, 생성자로 ErrorCode를 받아 어떤 종류의 에러인지 명시
 *
 */
@Slf4j
@RestControllerAdvice // 모든 컨트롤러를 감시
public class GlobalExceptionHandler {

    @ExceptionHandler(GlobalException.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(GlobalException exception) {
        ErrorCode code = exception.getCode();
        log.info("Application Exception occurred -> code: {} message: {}", code.getCode(),
                code.getMessage());
        return ResponseEntity.status(code.getHttpStatus()).body(ErrorResponse.from(code));
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<MethodArgumentExceptionResponse> handleMethodArgumentExceptionResponse(
            MethodArgumentNotValidException exception
    ) {
        BindingResult bindingResult = exception.getBindingResult();

        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        log.info("MethodArgumentNotValidException occurred: {}", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MethodArgumentExceptionResponse.from(
                        InternalServerErrorCode.INVALID_INPUT_VALUE, errors));
    }

}
