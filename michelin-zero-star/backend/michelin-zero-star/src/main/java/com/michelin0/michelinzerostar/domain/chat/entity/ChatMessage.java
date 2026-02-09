package com.michelin0.michelinzerostar.domain.chat.entity;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "chat_messages")
public class ChatMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_messages_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_read")
    private boolean isRead;

    @Builder
    public ChatMessage(ChatRoom chatRoom, User sender, String message, String imageUrl, boolean isRead) {
        this.chatRoom = chatRoom;
        this.sender = sender;
        this.message = message;
        this.imageUrl = imageUrl;
        this.isRead = isRead;
    }
}