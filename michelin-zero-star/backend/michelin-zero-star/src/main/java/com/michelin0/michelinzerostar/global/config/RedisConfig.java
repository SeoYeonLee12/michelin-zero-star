package com.michelin0.michelinzerostar.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Key와 Value를 직렬화(Serializer) 설정해야 Redis-cli에서 사람이 읽을 수 있는 텍스트로 저장됩니다.

        // Key: String으로 직렬화
        template.setKeySerializer(new StringRedisSerializer());

        // Value: 일단 String으로 직렬화 (Refresh Token이 단순 문자열이므로)
        // 추후 객체(JSON)를 저장해야 한다면 GenericJackson2JsonRedisSerializer 등으로 변경 가능
        template.setValueSerializer(new StringRedisSerializer());

        // Hash Key-Value에 대한 직렬화 설정 (필요 시 사용)
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());

        return template;
    }
}