package com.michelin0.michelinzerostar.domain.aichatmessage.application.command;

import java.time.LocalDateTime;

public record RedisChatSaveCommand(
        String senderType,
        LocalDateTime sendDate,
        String content
) {

}
