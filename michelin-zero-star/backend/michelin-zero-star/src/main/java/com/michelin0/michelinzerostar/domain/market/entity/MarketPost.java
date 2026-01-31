package com.michelin0.michelinzerostar.domain.market.entity;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.SoftDeleteDomain;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Getter
@Table(name = "market_posts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE market_posts SET deleted_at = NOW() WHERE market_posts_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class MarketPost extends SoftDeleteDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_posts_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private User writer;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private int price;

    @Enumerated(EnumType.STRING)
    private PostStatus status;

    private String meetingPlace;

    private String locationText; // 동 이름
    private String locationCode; // 행정동 코드

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    private String category;

    private int chatCount;

    @Column(nullable = false)
    private int likeCount = 0;

    @OneToMany(mappedBy = "marketPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MarketPostImage> images = new ArrayList<>();

    @Builder
    public MarketPost(User writer, String title, String content, int price, String meetingPlace,
            String locationText, String locationCode, BigDecimal latitude, BigDecimal longitude,
            String category) {
        this.writer = writer;
        this.title = title;
        this.content = content;
        this.price = price;
        this.meetingPlace = meetingPlace;
        this.status = PostStatus.SELLING;
        this.chatCount = 0;
        this.likeCount = 0;

        this.locationText = locationText;
        this.locationCode = locationCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
    }

    public void increaseLikeCount() {
        this.likeCount++;
    }

    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    public void update(String title, String content, int price, String meetingPlace, String category) {
        this.title = title;
        this.content = content;
        this.price = price;
        this.meetingPlace = meetingPlace;
        this.category = category;
    }

    // 상태 변경 메서드
    public void updateStatus(PostStatus status) {
        this.status = status;
    }

    public void addImage(MarketPostImage image) {
        this.images.add(image);
        image.assignPost(this);
    }
}