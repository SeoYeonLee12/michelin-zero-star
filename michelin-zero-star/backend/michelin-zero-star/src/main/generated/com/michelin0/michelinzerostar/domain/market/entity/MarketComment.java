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
@Table(name = "market_comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketComment extends BaseDomain {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "market_comments_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private MarketPost marketPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_id", nullable = false)
    private User writer;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // 대댓글 기능 (부모 댓글)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private MarketComment parent;

    // 자식 댓글 리스트 (대댓글이 삭제될 때 같이 삭제됨)
    @OneToMany(mappedBy = "parent", orphanRemoval = true)
    private List<MarketComment> children = new ArrayList<>();

    @Builder
    public MarketComment(MarketPost marketPost, User writer, String content, MarketComment parent) {
        this.marketPost = marketPost;
        this.writer = writer;
        this.content = content;
        this.parent = parent;
    }
}