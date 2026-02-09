package com.michelin0.michelinzerostar.global.redis;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisUtil {

    private final RedisTemplate<String, Object> redisTemplate;

    public void setRefreshToken(String userId, String refreshToken, long expirationTime) {
        redisTemplate.opsForValue()
                .set("RefreshToken:" + userId, refreshToken, Duration.ofMillis(expirationTime));
    }

    public String getRefreshToken(String userId) {
        return (String) redisTemplate.opsForValue().get("RefreshToken:" + userId);
    }

    public void deleteRefreshToken(String userId) {
        redisTemplate.delete("RefreshToken:" + userId);
    }

    public void setBlackList(String accessToken, long remainingTime) {
        redisTemplate.opsForValue()
                .set("BlackList:" + accessToken, "logout", Duration.ofMillis(remainingTime));
    }

    public boolean hasKeyBlackList(String accessToken) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("BlackList:" + accessToken));
    }

    public String getData(String key) {
        return (String) redisTemplate.opsForValue().get(key);
    }

    public void deleteData(String key) {
        redisTemplate.delete(key);
    }

    public void setDataExpire(String key, String value, long duration) {
        redisTemplate.opsForValue().set(key, value, duration, TimeUnit.SECONDS);
    }
}