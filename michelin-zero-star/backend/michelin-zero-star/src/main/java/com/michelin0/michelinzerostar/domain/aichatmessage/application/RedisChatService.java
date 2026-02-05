package com.michelin0.michelinzerostar.domain.aichatmessage.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiToUserResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.command.RedisChatSaveCommand;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.enums.SenderType;
import com.michelin0.michelinzerostar.global.exception.errorcode.InternalServerErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisChatService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private static final long GLOBAL_CHAT_TTL = 1;

    // 유저 질문 레디스 저장 메소드
    public void saveUserMessage(Long userId, String content) {
        String key = "chat:global:user:" + userId;
        RedisChatSaveCommand command = new RedisChatSaveCommand(
                SenderType.USER.toString(),
                LocalDateTime.now(),
                content
        );
        try {
            String jsonValue = objectMapper.writeValueAsString(command);
            redisTemplate.opsForList().rightPush(key, jsonValue);
            redisTemplate.expire(key, GLOBAL_CHAT_TTL, TimeUnit.DAYS);
        } catch (JsonProcessingException e) {
            throw new GlobalException(InternalServerErrorCode.JSON_SERIALIZATION_ERROR);
        }
    }

    // AI 응답 레디스 저장 메소드 생성
    public void saveAiMessage(Long userId, AiToUserResponse response) {
        String key = "chat:global:user:" + userId;
        RedisChatSaveCommand command = new RedisChatSaveCommand(
                response.senderType(),
                response.sendDate(),
                response.content()
        );
        try {
            String jsonValue = objectMapper.writeValueAsString(command);
            redisTemplate.opsForList().rightPush(key, jsonValue);
            redisTemplate.expire(key, GLOBAL_CHAT_TTL, TimeUnit.DAYS);
        } catch (JsonProcessingException e) {
            throw new GlobalException(InternalServerErrorCode.JSON_SERIALIZATION_ERROR);
        }
    }

}
