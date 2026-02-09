package com.michelin0.michelinzerostar.global.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    /**
     * 기존 DB 스키마가 Integer로 생성되어 있는 경우를 대비해 Double로 마이그레이션합니다.
     * 데이터 손실 없이 컬럼 타입을 변경합니다.
     */
    @Bean
    public CommandLineRunner databaseSchemaFixer() {
        return args -> {
            try {
                log.info("🛠️ Checking and fixing database schema types for Star Logic...");
                
                // 1. Fix users.total_star (Integer -> Double)
                // MySQL에서 INT -> DOUBLE 변경은 데이터 손실 없이 가능합니다 (1 -> 1.0)
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN total_star DOUBLE DEFAULT 0.0 NOT NULL");
                log.info("✅ Executed: ALTER TABLE users MODIFY COLUMN total_star DOUBLE DEFAULT 0.0 NOT NULL");

                // 2. Fix star_history.amount (Integer -> Double)
                jdbcTemplate.execute("ALTER TABLE star_history MODIFY COLUMN amount DOUBLE NOT NULL");
                log.info("✅ Executed: ALTER TABLE star_history MODIFY COLUMN amount DOUBLE NOT NULL");
                
                log.info("✨ Database schema fix completed successfully.");
            } catch (Exception e) {
                // 이미 변경되었거나, 테이블이 없는 경우 등 예외 발생 시 로그만 남기고 넘어갑니다.
                log.warn("⚠️ Schema fix operation skipped or failed: {}", e.getMessage());
            }
        };
    }
}
