USE `michelin-zero-star`;

-- [0] 외래 키 검사 중지 및 기존 데이터 정리
SET FOREIGN_KEY_CHECKS = 0;

-- [1] 카테고리 데이터 삽입 (기초 데이터)
INSERT INTO categories (category_name)
VALUES ('밥'), ('반찬'), ('국물'), ('면'), ('디저트'),
       ('분식'), ('샐러드'), ('음료'), ('기타'),
       ('야식&술안주'), ('한식'), ('일식');

-- [2] 유저 데이터 생성
-- 시스템 관리자 (크롤링 봇)
INSERT INTO users (email, password, name, nickname, role, total_star, created_at, updated_at)
VALUES ('crawling_bot@michelin0.com', '$2a$10$DUMMYHASHFOREXAMPLE', '시스템 관리자', 'CRAWLINGBOT', 'USER', 5.0, NOW(), NOW());

-- 사용자 1 (찜을 누를 사람)
INSERT INTO users (email, password, name, nickname, role, total_star, created_at, updated_at)
VALUES ('user1@example.com', '$2a$10$DUMMYHASH1', '사용자1', '역삼동주민', 'USER', 0.0, NOW(), NOW());
SET @user1_id = LAST_INSERT_ID();

-- 사용자 2 (게시글 작성자)
INSERT INTO users (email, password, name, nickname, role, total_star, created_at, updated_at)
VALUES ('user2@example.com', '$2a$10$DUMMYHASH2', '사용자2', '나눔천사', 'USER', 0.0, NOW(), NOW());
SET @user2_id = LAST_INSERT_ID();

-- [3] 사용자 프로필 생성 (동네 인증 상태 포함)
INSERT INTO user_profiles (users_id, location_address, location_code, latitude, longitude, is_verified, created_at, updated_at)
VALUES
    (@user1_id, '서울 강남구 역삼동', '1168010100', 37.500628, 127.036392, 1, NOW(), NOW()),
    (@user2_id, '서울 강남구 역삼동', '1168010100', 37.500628, 127.036392, 1, NOW(), NOW());

-- [4] 마켓 게시글 생성 (유저 2가 작성, category 컬럼 제거됨)
INSERT INTO market_posts (
    users_id,
    title,
    content,
    price,
    status,
    location_text,
    location_code,
    meeting_place,
    chat_count,
    like_count,
    latitude,
    longitude,
    created_at,
    updated_at
)
VALUES (
           @user2_id,
           '신선한 유기농 방울토마토 나눔합니다',
           '텃밭에서 직접 키운 방울토마토예요. 양이 많아 나눕니다.',
           0,
           'SELLING',
           '서울 강남구 역삼동',
           '1168010100',
           '역삼역 3번 출구 앞',
           0,
           1, -- 유저 1이 찜할 예정이므로 초기값 1 설정
           37.500628,
           127.036392,
           NOW(),
           NOW()
       );
SET @post1_id = LAST_INSERT_ID();

-- [5] 게시글 이미지 생성
INSERT INTO market_post_images (post_id, image_url, order_index, created_at, updated_at)
VALUES (@post1_id, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea', 0, NOW(), NOW());

-- [6] 좋아요 데이터 생성 (유저 1이 유저 2의 글을 찜함)
INSERT INTO market_likes (users_id, post_id, created_at, updated_at)
VALUES (@user1_id, @post1_id, NOW(), NOW());

-- [7] 외래 키 검사 다시 활성화
SET FOREIGN_KEY_CHECKS = 1;

-- [8] 데이터 삽입 결과 확인
SELECT 'DATA_INSERT_SUCCESS' as status;