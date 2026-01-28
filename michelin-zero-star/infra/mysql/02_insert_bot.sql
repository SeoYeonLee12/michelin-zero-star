-- 크롤링 봇 계정 생성
INSERT INTO users (
    email, 
    password, 
    name, 
    nickname, 
    role, 
    total_star, 
    created_at, 
    updated_at
) VALUES (
    'crawling_bot@michelin0.com',
    '$2a$10$DUMMYHASHFOREXAMPLE',
    '시스템 관리자',
    'CRAWLINGBOT',
    'USER',
    5.0,
    NOW(), 
    NOW()
);

-- 봇 프로필 생성
INSERT INTO user_profiles (
    users_id, 
    location_address, 
    location_code, 
    latitude,
    longitude,
    is_verified, 
    created_at, 
    updated_at
) VALUES (
    LAST_INSERT_ID(),
    'System Server',
    '00000',
    0,
    0,
    1,
    NOW(), 
    NOW()
);