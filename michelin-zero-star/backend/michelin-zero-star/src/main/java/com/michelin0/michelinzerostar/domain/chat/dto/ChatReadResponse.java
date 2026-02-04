package com.michelin0.michelinzerostar.domain.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatReadResponse {
    private Long roomId;
    private Long readerId;
}
