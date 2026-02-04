package com.michelin0.michelinzerostar.domain.aichatmessage.application;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiCommonChatbotResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.presentation.dto.ChatMessage;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisChatService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final long GLOBAL_CHAT_TTL = 1;

    public void saveMessage(Long userId, AiCommonChatbotResponse message) {
        String key = "chat:global:user:" + userId;
        redisTemplate.opsForList().rightPush(key, message);
        redisTemplate.expire(key, GLOBAL_CHAT_TTL, TimeUnit.DAYS);
    }
}
