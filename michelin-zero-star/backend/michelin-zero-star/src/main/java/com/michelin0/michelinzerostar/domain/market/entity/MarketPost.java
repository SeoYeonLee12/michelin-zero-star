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
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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
    @JoinColumn(name = "writer_id", nullable = false)
    private User writer;

    @Column(nullable = false)
    private String title;

    @Lob
    private String content;

    private int price;

    @Enumerated(EnumType.STRING)
    private PostStatus status;

    private String meetingPlace;

    private String locationText; // 동 이름
    private String locationCode; // 행정동 코드

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    private String category;

    private int chatCount;

    @OneToMany(mappedBy = "marketPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MarketPostImage> images = new ArrayList<>();

    @Builder
    public MarketPost(User writer, String title, String content, int price, String meetingPlace,
            String locationText, String locationCode, Double latitude, Double longitude,
            String category) {
        this.writer = writer;
        this.title = title;
        this.content = content;
        this.price = price;
        this.meetingPlace = meetingPlace;
        this.status = PostStatus.SELLING;
        this.chatCount = 0;

        this.locationText = locationText;
        this.locationCode = locationCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
    }

    public void update(String title, String content, int price, String meetingPlace) {
        this.title = title;
        this.content = content;
        this.price = price;
        this.meetingPlace = meetingPlace;
    }

    public void addImage(MarketPostImage image) {
        this.images.add(image);
        image.assignPost(this);
    }
}