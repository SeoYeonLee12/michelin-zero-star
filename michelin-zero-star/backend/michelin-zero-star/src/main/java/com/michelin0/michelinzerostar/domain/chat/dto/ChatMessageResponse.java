package com.michelin0.michelinzerostar.domain.chat.dto;

import com.michelin0.michelinzerostar.domain.chat.entity.ChatMessage;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageResponse {

    private Long messageId;
    private Long senderId;   // 보낸 사람 (내가 보낸 건지, 상대가 보낸 건지 구분용)
    private String content;  // 메시지 내용
    private LocalDateTime sendTime; // 보낸 시간
    private boolean isRead;  // 읽음 여부

    public ChatMessageResponse(ChatMessage message) {
        this.messageId = message.getId();
        this.senderId = message.getSender().getId();
        this.content = message.getMessage();
        this.sendTime = message.getCreatedAt();
        this.isRead = message.isRead();
    }
}