package com.michelin0.michelinzerostar.domain.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageRequest {

    private String content;
    private String imageUrl;
}