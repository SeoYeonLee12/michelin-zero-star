package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum AuthErrorCode implements ErrorCode {

    // 인증 실패 (401) -> 로그인이 필요하거나 실패했을 때
    AUTHENTICATION_FAILED(HttpStatus.UNAUTHORIZED, "AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다."),

    // 인가 실패 (403) -> 권한이 없는 페이지 요청 시
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH_002", "접근 권한이 없습니다."),

    // 중복 가입 에러 (409) -> 이미 가입된 회원
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "AUTH_003", "이미 가입된 이메일입니다."),

    // 로그인 시 닉네임 중복 에러(409) -> 이미 존재하는 닉네암
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "AUTH_004", "이미 존재하는 닉네임입니다."),

    // 닉네임 수정 시 기존 닉네임 중복 에러(400) -> 기존 닉네임과 바꾸려는 닉네임이 같음
    SAME_AS_OLD_NICKNAME(HttpStatus.BAD_REQUEST, "AUTH_005", "새 닉네임은 기존 닉네임과 달라야 합니다."),

    // 기존 비밀번호와 중복 에러(400) -> 기존 비밀번호와 바꾸려는 비밀번호가 같음
    SAME_AS_OLD_PASSWORD(HttpStatus.BAD_REQUEST, "AUTH_006", "새 비밀번호는 기존 비밀번호와 달라야 합니다.");
    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}