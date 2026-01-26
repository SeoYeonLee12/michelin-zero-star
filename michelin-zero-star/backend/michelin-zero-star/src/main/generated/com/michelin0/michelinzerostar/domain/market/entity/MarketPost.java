package com.michelin0.michelinzerostar.domain.market.entity;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.BaseDomain;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Table(name = "market_posts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketPost extends BaseDomain {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_posts_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_id", nullable = false)
    private User writer;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private int price; // 무료나눔이면 0원

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status; // 판매중, 예약중, 거래완료

    // 게시글 작성 시점의 위치 정보 박제 (필수)
    @Column(name = "location_text", nullable = false)
    private String locationText; // "둔산동"

    @Column(name = "location_code", nullable = false)
    private String locationCode; // 행정동 코드

    @Column(name = "meeting_place")
    private String meetingPlace; // 거래 희망 장소

    @Column(name = "chat_count")
    private int chatCount; // 채팅방 개수 카운트

    // CascadeType.ALL -> 게시글 삭제 시 이미지도 같이 삭제
    @OneToMany(mappedBy = "marketPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MarketPostImage> images = new ArrayList<>();

    @Builder
    public MarketPost(User writer, String title, String content, int price, String locationText, String locationCode, String meetingPlace) {
        this.writer = writer;
        this.title = title;
        this.content = content;
        this.price = price;
        this.locationText = locationText;
        this.locationCode = locationCode;
        this.meetingPlace = meetingPlace;
        this.status = PostStatus.SELLING; // 기본값: 판매중
        this.chatCount = 0;
    }

    // 이미지 추가 편의 메서드
    public void addImage(MarketPostImage image) {
        this.images.add(image);
        image.setMarketPost(this);
    }

    // 채팅방 생성 시 카운트 증가
    public void increaseChatCount() {
        this.chatCount++;
    }
}