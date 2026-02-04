// src/main/java/com/michelin0/michelinzerostar/domain/chat/dto/ChatMessageRequest.java

package com.michelin0.michelinzerostar.domain.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChatMessageRequest {
    private Long roomId;
    private String content;
    private String imageUrl;
    private Long readerId;
}