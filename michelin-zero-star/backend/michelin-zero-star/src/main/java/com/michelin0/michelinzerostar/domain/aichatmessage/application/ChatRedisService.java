package com.michelin0.michelinzerostar.domain.aichatmessage.application;

import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatRedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void saveMessage(String roomId, ChatMessage message) {
        String key = "chat:room:" + roomId;
        redisTemplate.opsForList().rightPush(key, message);
    }
}
