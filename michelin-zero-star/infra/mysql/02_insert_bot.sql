-- 크롤링 봇 계정 생성
INSERT INTO users (email,
                   password,
                   name,
                   nickname,
                   role,
                   total_star,
                   created_at,
                   updated_at)
VALUES ('crawling_bot@michelin0.com',
        '$2a$10$DUMMYHASHFOREXAMPLE',
        '시스템 관리자',
        'CRAWLINGBOT',
        'USER',
        5.0,
        NOW(),
        NOW());

-- 봇 프로필 생성 (수정됨: 위도/경도 추가)
INSERT INTO user_profiles (users_id,
                           location_address,
                           location_code,
                           is_verified,
                           created_at,
                           updated_at,
                           latitude, -- 추가된 부분
                           longitude -- 추가된 부분
)
VALUES (LAST_INSERT_ID(),
        'System Server',
        '00000',
        1,
        NOW(),
        NOW(),
        0.0, -- 추가된 부분 (위도 기본값)
        0.0 -- 추가된 부분 (경도 기본값)
       );
