package com.michelin0.michelinzerostar.domain.market.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MarketCommentRequest {

    private String content;
    private Long parentId; // 대댓글일 경우 부모 댓글 ID (없으면 null)
}