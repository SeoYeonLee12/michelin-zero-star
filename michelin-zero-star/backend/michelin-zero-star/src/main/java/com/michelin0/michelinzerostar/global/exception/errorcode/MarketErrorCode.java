package com.michelin0.michelinzerostar.global.exception.errorcode;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum MarketErrorCode implements ErrorCode {

    // 게시글 조회 실패 (404)
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "MARKET_001", "게시글을 찾을 수 없습니다."),

    // 권한 없음 (403) - 본인 글이 아닐 때
    NOT_POST_OWNER(HttpStatus.FORBIDDEN, "MARKET_002", "작성자만 수정/삭제할 수 있습니다."),

    // 이미 삭제된 글 (400 또는 404)
    ALREADY_DELETED_POST(HttpStatus.BAD_REQUEST, "MARKET_003", "이미 삭제된 게시글입니다."),

    // 동네 인증 미완료 (400)
    LOCATION_AUTH_REQUIRED(HttpStatus.BAD_REQUEST, "MARKET_004", "동네 인증 후 게시글을 작성할 수 있습니다."),

    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "MARKET_005", "댓글을 찾을 수 없습니다."),

    NOT_COMMENT_OWNER(HttpStatus.FORBIDDEN, "MARKET_006", "댓글 작성자만 삭제할 수 있습니다."),

    CANNOT_REPLY_TO_REPLY(HttpStatus.BAD_REQUEST, "MARKET_007", "대대댓글은 작성할 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}