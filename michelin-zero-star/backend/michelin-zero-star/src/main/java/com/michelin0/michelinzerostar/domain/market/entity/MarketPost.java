package com.michelin0.michelinzerostar.domain.market.entity;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.SoftDeleteDomain;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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

    @Column(nullable = false)
    private Integer price; // 0원일 경우 '나눔'으로 처리

    @Enumerated(EnumType.STRING)
    private PostStatus status;

    private String meetingPlace;

    private String locationText;
    private String locationCode;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    private int chatCount;

    @Column(nullable = false)
    private int likeCount = 0;

    @OneToMany(mappedBy = "marketPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MarketPostImage> images = new ArrayList<>();

    @Builder
    public MarketPost(User writer, String title, String content, Integer price, String meetingPlace,
            String locationText, String locationCode, BigDecimal latitude, BigDecimal longitude) {
        this.writer = writer;
        this.title = title;
        this.content = content;
        this.price = (price == null) ? 0 : price;
        this.meetingPlace = meetingPlace;
        this.status = PostStatus.SELLING;
        this.chatCount = 0;
        this.likeCount = 0;

        this.locationText = locationText;
        this.locationCode = locationCode;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void increaseLikeCount() {
        this.likeCount++;
    }

    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    public void increaseChatCount() {
        this.chatCount++;
    }

    public void update(String title, String content, Integer price, String meetingPlace) {
        this.title = title;
        this.content = content;
        this.price = (price == null) ? 0 : price;
        this.meetingPlace = meetingPlace;
    }

    public void updateStatus(PostStatus status) {
        this.status = status;
    }

    public void addImage(MarketPostImage image) {
        this.images.add(image);
        image.assignPost(this);
    }
}