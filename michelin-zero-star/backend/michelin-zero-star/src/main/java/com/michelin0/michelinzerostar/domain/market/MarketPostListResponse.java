package com.michelin0.michelinzerostar.domain.market.dto.response;

import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPostImage;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import lombok.Getter;

@Getter
public class MarketPostListResponse {

    private Long id;
    private String title;
    private int price;
    private String location;
    private String thumbnailUrl;
    private String timeAgo;
    private String status;
    private int chatCount;

    public MarketPostListResponse(MarketPost post) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.price = post.getPrice();
        this.location = post.getLocationText();
        this.status = post.getStatus().name();
        this.chatCount = post.getChatCount();
        this.timeAgo = calculateTimeAgo(post.getCreatedAt());

        this.thumbnailUrl = post.getImages().stream()
                .min(Comparator.comparingInt(MarketPostImage::getOrderIndex))
                .map(MarketPostImage::getImageUrl)
                .orElse(null);
    }

    private String calculateTimeAgo(LocalDateTime createdAt) {
        if (createdAt == null) {
            return "";
        }
        Duration duration = Duration.between(createdAt, LocalDateTime.now());
        long seconds = duration.getSeconds();

        if (seconds < 60) {
            return "방금 전";
        }
        long minutes = seconds / 60;
        if (minutes < 60) {
            return minutes + "분 전";
        }
        long hours = minutes / 60;
        if (hours < 24) {
            return hours + "시간 전";
        }
        long days = hours / 24;
        return days + "일 전";
    }
}