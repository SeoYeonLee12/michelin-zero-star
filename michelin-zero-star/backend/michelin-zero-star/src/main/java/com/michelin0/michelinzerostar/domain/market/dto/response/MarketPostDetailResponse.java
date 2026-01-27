package com.michelin0.michelinzerostar.domain.market.dto.response;

import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPostImage;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Getter;

@Getter
public class MarketPostDetailResponse {

    private Long id;
    private String title;
    private String content;
    private int price;
    private String meetingPlace;
    private String location;
    private String status;
    private int chatCount;
    private String writerNickname; // 작성자 닉네임
    private boolean isOwner;       // 조회자가 작성자인지 여부 (프론트 버튼 처리에 필요)
    private List<String> imageUrls; // 모든 이미지 URL
    private LocalDateTime createdAt;

    public MarketPostDetailResponse(MarketPost post, Long currentUserId) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.price = post.getPrice();
        this.meetingPlace = post.getMeetingPlace();
        this.location = post.getLocationText();
        this.status = post.getStatus().name();
        this.chatCount = post.getChatCount();
        this.writerNickname = post.getWriter().getNickname();
        this.createdAt = post.getCreatedAt();

        // 현재 로그인한 유저가 작성자인지 확인
        this.isOwner = post.getWriter().getId().equals(currentUserId);

        // 이미지 리스트 (순서대로 정렬)
        this.imageUrls = post.getImages().stream()
                .sorted(Comparator.comparingInt(MarketPostImage::getOrderIndex))
                .map(MarketPostImage::getImageUrl)
                .collect(Collectors.toList());
    }
}