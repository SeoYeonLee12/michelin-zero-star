package com.michelin0.michelinzerostar.domain.chat.entity;

import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.BaseTimeEntity;
import jakarta.persistence.CascadeType;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "chat_rooms")
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_rooms_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private MarketPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;


    // 판매자 상태
    private boolean isSellerLeft = false; // 판매자가 나갔는지
    private LocalDateTime sellerJoinedAt; // 판매자가 대화를 보기 시작한 시간

    // 구매자 상태
    private boolean isBuyerLeft = false;  // 구매자가 나갔는지
    private LocalDateTime buyerJoinedAt;  // 구매자가 대화를 보기 시작한 시간

    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMessage> messages = new ArrayList<>();

    @Builder
    public ChatRoom(MarketPost post, User seller, User buyer) {
        this.post = post;
        this.seller = seller;
        this.buyer = buyer;
        this.sellerJoinedAt = LocalDateTime.now();
        this.buyerJoinedAt = LocalDateTime.now();
    }

    public void updateLastMessage(String message) {
        this.lastMessage = message;
        this.lastMessageAt = LocalDateTime.now();
    }

    public void setSellerLeft(boolean status) {
        this.isSellerLeft = status;
    }

    public void setBuyerLeft(boolean status) {
        this.isBuyerLeft = status;
    }

    public void setSellerJoinedAt(LocalDateTime time) {
        this.sellerJoinedAt = time;
    }

    public void setBuyerJoinedAt(LocalDateTime time) {
        this.buyerJoinedAt = time;
    }
}