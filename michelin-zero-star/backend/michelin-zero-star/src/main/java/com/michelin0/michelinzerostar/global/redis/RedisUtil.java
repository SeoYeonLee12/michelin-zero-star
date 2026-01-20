package com.michelin0.michelinzerostar.global.redis;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisUtil {

    private final RedisTemplate<String, Object> redisTemplate;

    public void setRefreshToken(String userId, String refreshToken, long expirationTime) {
        redisTemplate.opsForValue()
                .set("RT:" + userId, refreshToken, Duration.ofMillis(expirationTime));
    }

    public String getRefreshToken(String userId) {
        return (String) redisTemplate.opsForValue().get("RT:" + userId);
    }

    public void deleteRefreshToken(String userId) {
        redisTemplate.delete("RT:" + userId);
    }

    public void setBlackList(String accessToken, long remainingTime) {
        redisTemplate.opsForValue()
                .set("BL:" + accessToken, "logout", Duration.ofMillis(remainingTime));
    }

    public boolean hasKeyBlackList(String accessToken) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("BL:" + accessToken));
    }
}