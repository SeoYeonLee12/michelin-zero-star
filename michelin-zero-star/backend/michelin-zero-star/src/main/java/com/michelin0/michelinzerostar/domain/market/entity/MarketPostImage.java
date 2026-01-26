package com.michelin0.michelinzerostar.domain.market.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "market_post_images")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketPostImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_post_image_id")
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    private int orderIndex; // 이미지 순서

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "market_post_id")
    private MarketPost marketPost;

    @Builder
    public MarketPostImage(String imageUrl, int orderIndex) {
        this.imageUrl = imageUrl;
        this.orderIndex = orderIndex;
    }

    public void assignPost(MarketPost marketPost) {
        this.marketPost = marketPost;
    }
}