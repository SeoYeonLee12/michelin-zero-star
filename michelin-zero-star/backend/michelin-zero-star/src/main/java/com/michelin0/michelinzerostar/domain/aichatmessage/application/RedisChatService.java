package com.michelin0.michelinzerostar.domain.aichatmessage.application;

import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisChatService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void saveMessage(String userId, ChatMessage message) {
        String key = "chat:global:user:" + userId;
        redisTemplate.opsForList().rightPush(key, message);
    }
}
