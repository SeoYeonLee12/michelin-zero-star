package com.michelin0.michelinzerostar.global.config;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor // 1. 롬복으로 생성자 자동 생성
public class QuerydslConfig {

    private final EntityManager em; // 2. final 붙여서 필수 의존성으로 선언

    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(em);
    }
}