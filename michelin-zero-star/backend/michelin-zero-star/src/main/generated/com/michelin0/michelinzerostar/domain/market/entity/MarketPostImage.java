package com.michelin0.michelinzerostar.domain.market.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "market_post_images")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketPostImage {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_post_images_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private MarketPost marketPost;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "order_index")
    private int orderIndex; // 0번이 대표 이미지

    @Builder
    public MarketPostImage(String imageUrl, int orderIndex) {
        this.imageUrl = imageUrl;
        this.orderIndex = orderIndex;
    }

    // 연관관계 설정을 위한 Setter
    public void setMarketPost(MarketPost marketPost) {
        this.marketPost = marketPost;
    }
}