package com.michelin0.michelinzerostar.domain.market.dto.response;

import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPostImage;
import com.michelin0.michelinzerostar.domain.user.entity.User;
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
    private String location;        // 지역 정보
    private String status;
    private int chatCount;
    private int likeCount;          // 찜 수 추가
    private String nickname;        // 작성자 닉네임
    private String profileImageUrl; // 작성자 프로필 이미지
    private double totalStar;       // 작성자 별점
    private boolean isOwner;        // 본인 글 여부
    private List<String> imageUrls;
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
        this.likeCount = post.getLikeCount();
        this.createdAt = post.getCreatedAt();

        // 작성자 정보 매핑
        User writer = post.getWriter();
        this.nickname = writer.getNickname();
        this.profileImageUrl = writer.getProfileImageUrl();
        this.totalStar = writer.getTotalStar();

        // 현재 로그인한 유저가 작성자인지 확인 (비로그인 처리 포함)
        this.isOwner = currentUserId != null && writer.getId().equals(currentUserId);

        // 이미지 리스트 (순서 정렬)
        this.imageUrls = post.getImages().stream()
                .sorted(Comparator.comparingInt(MarketPostImage::getOrderIndex))
                .map(MarketPostImage::getImageUrl)
                .collect(Collectors.toList());
    }
}