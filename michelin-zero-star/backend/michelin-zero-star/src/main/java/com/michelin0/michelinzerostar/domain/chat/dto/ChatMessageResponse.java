package com.michelin0.michelinzerostar.domain.chat.dto;

import com.michelin0.michelinzerostar.domain.chat.entity.ChatMessage;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageResponse {

    private Long messageId;
    private Long senderId;
    private String senderNickname;
    private String content;
    private String imageUrl;
    private LocalDateTime sendTime;
    private boolean isRead;

    public ChatMessageResponse(ChatMessage message) {
        this.messageId = message.getId();
        this.senderId = message.getSender().getId();
        this.senderNickname = message.getSender().getNickname();
        this.content = message.getMessage();
        this.imageUrl = message.getImageUrl();
        this.sendTime = message.getCreatedAt();
        this.isRead = message.isRead();
    }
}