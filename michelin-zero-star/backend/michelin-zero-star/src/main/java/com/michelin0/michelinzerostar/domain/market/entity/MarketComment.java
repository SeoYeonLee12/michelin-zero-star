package com.michelin0.michelinzerostar.domain.market.entity;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "market_comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketComment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_comments_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private MarketPost marketPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private User writer;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // [대댓글 구조] 부모 댓글
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private MarketComment parent;

    // [대댓글 구조] 자식 댓글 리스트
    @OneToMany(mappedBy = "parent", orphanRemoval = true)
    private List<MarketComment> children = new ArrayList<>();

    @Builder
    public MarketComment(MarketPost marketPost, User writer, String content, MarketComment parent) {
        this.marketPost = marketPost;
        this.writer = writer;
        this.content = content;
        this.parent = parent;
    }

    public void updateContent(String content) {
        this.content = content;
    }
}