package com.michelin0.michelinzerostar.domain.market.dto.response;

import com.michelin0.michelinzerostar.domain.market.entity.MarketComment;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Getter;

@Getter
public class MarketCommentResponse {

    private Long id;
    private String content;
    private String writerNickname;
    private String writerProfileImage;
    private LocalDateTime createdAt;
    private List<MarketCommentResponse> children; // 대댓글 리스트

    public MarketCommentResponse(MarketComment comment) {
        this.id = comment.getId();
        this.content = comment.getContent();
        this.writerNickname = comment.getWriter().getNickname();
        this.writerProfileImage = comment.getWriter().getProfileImageUrl();
        this.createdAt = comment.getCreatedAt();
        this.children = comment.getChildren().stream()
                .map(MarketCommentResponse::new)
                .collect(Collectors.toList());
    }
}