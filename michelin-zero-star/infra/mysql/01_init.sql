-- [1] 외래 키 검사 비활성화
SET
FOREIGN_KEY_CHECKS = 0;

-- [2] 테이블 초기화 (DROP)
DROP TABLE IF EXISTS ai_chat_message;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_rooms;
DROP TABLE IF EXISTS market_comments;
DROP TABLE IF EXISTS market_likes;
DROP TABLE IF EXISTS market_post_images;
DROP TABLE IF EXISTS market_posts;
DROP TABLE IF EXISTS cooking_logs;
DROP TABLE IF EXISTS recipe_reviews;
DROP TABLE IF EXISTS user_recipe_scraps;
DROP TABLE IF EXISTS recipe_tags;
DROP TABLE IF EXISTS recipe_steps;
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS recipe_categories;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS user_favorite_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS star_history;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

-- [3] 테이블 생성 (CREATE)

CREATE TABLE users
(
    users_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    email             VARCHAR(255) NOT NULL,
    password          VARCHAR(255) NULL,
    name              VARCHAR(100) NOT NULL,
    nickname          VARCHAR(100) NOT NULL,
    profile_image_url VARCHAR(255) NULL,
    role              VARCHAR(50)  NOT NULL DEFAULT 'USER',
    social_provider   VARCHAR(50) NULL,
    social_id         VARCHAR(255) NULL,
    total_star DOUBLE NOT NULL DEFAULT 0.0,
    deleted_at        TIMESTAMP NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_profiles
(
    users_id         BIGINT         NOT NULL,
    location_address VARCHAR(255) NULL,
    location_code    VARCHAR(50) NULL,
    latitude         DECIMAL(10, 8) NOT NULL,
    longitude        DECIMAL(11, 8) NOT NULL,
    is_verified      TINYINT(1) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (users_id),
    CONSTRAINT fk_user_profiles_users FOREIGN KEY (users_id) REFERENCES users (users_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE star_history
(
    star_history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id        BIGINT    NOT NULL,
    type            ENUM('COOK_COMPLETE', 'RECIPE_REGISTER') NOT NULL,
    amount DOUBLE NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_star_user FOREIGN KEY (users_id) REFERENCES users (users_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories
(
    categories_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_favorite_categories
(
    user_favorite_categories_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id                    BIGINT    NOT NULL,
    categories_id               BIGINT    NOT NULL,
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fav_user FOREIGN KEY (users_id) REFERENCES users (users_id),
    CONSTRAINT fk_fav_cat FOREIGN KEY (categories_id) REFERENCES categories (categories_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipes
(
    recipes_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id       BIGINT       NOT NULL,
    title          VARCHAR(255) NOT NULL,
    main_image_url VARCHAR(255) NOT NULL,
    description    TEXT         NOT NULL,
    cook_time      INT          NOT NULL,
    servings       INT          NOT NULL,
    scrap_count    INT          NOT NULL DEFAULT 0,
    review_count   INT          NOT NULL DEFAULT 0,
    average_rating DOUBLE NOT NULL DEFAULT 0.0,
    recipe_type    ENUM('USER', 'CHEF') NOT NULL DEFAULT 'USER',
    calories DOUBLE NOT NULL DEFAULT 0.0,
    carbohydrate DOUBLE NOT NULL DEFAULT 0.0,
    protein DOUBLE NOT NULL DEFAULT 0.0,
    saturated_fat DOUBLE NOT NULL DEFAULT 0.0,
    cholesterol DOUBLE NOT NULL DEFAULT 0.0,
    sodium DOUBLE NOT NULL DEFAULT 0.0,
    calcium DOUBLE NOT NULL DEFAULT 0.0,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at     TIMESTAMP NULL,
    CONSTRAINT fk_recipe_user FOREIGN KEY (users_id) REFERENCES users (users_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_categories
(
    recipe_categories_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipes_id           BIGINT    NOT NULL,
    categories_id        BIGINT    NOT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rc_recipe FOREIGN KEY (recipes_id) REFERENCES recipes (recipes_id),
    CONSTRAINT fk_rc_cat FOREIGN KEY (categories_id) REFERENCES categories (categories_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_ingredients
(
    recipe_ingredients_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipes_id            BIGINT       NOT NULL,
    name                  VARCHAR(100) NOT NULL,
    amount                VARCHAR(50)  NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ri_recipe FOREIGN KEY (recipes_id) REFERENCES recipes (recipes_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_steps
(
    recipe_steps_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipes_id      BIGINT       NOT NULL,
    step_number     INT          NOT NULL,
    description     TEXT         NOT NULL,
    timer_seconds   INT          NOT NULL,
    media_url       VARCHAR(255) NOT NULL,
    tip             TEXT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rs_recipe FOREIGN KEY (recipes_id) REFERENCES recipes (recipes_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_tags
(
    recipe_tags_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipes_id     BIGINT      NOT NULL,
    tag_name       VARCHAR(50) NOT NULL,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_recipe FOREIGN KEY (recipes_id) REFERENCES recipes (recipes_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_recipe_scraps
(
    user_recipe_scraps_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id              BIGINT    NOT NULL,
    recipes_id            BIGINT    NOT NULL,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_urs_user FOREIGN KEY (users_id) REFERENCES users (users_id),
    CONSTRAINT fk_urs_recipe FOREIGN KEY (recipes_id) REFERENCES recipes (recipes_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_reviews
(
    recipe_reviews_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id          BIGINT    NOT NULL,
    recipes_id        BIGINT    NOT NULL,
    rating DOUBLE NOT NULL DEFAULT 0.0,
    content           TEXT      NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at        TIMESTAMP NULL,
    CONSTRAINT fk_rr_user FOREIGN KEY (users_id) REFERENCES users (users_id),
    CONSTRAINT fk_rr_recipe FOREIGN KEY (recipes_id) REFERENCES recipes (recipes_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cooking_logs
(
    cooking_logs_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id        BIGINT    NOT NULL,
    recipes_id      BIGINT    NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cl_user FOREIGN KEY (users_id) REFERENCES users (users_id),
    CONSTRAINT fk_cl_recipe FOREIGN KEY (recipes_id) REFERENCES recipes (recipes_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE market_posts
(
    market_posts_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id        BIGINT         NOT NULL,
    title           VARCHAR(255)   NOT NULL,
    content         TEXT NULL,
    price           INT            NOT NULL DEFAULT 0,
    status          ENUM('SELLING', 'RESERVED', 'SOLD') NOT NULL DEFAULT 'SELLING',
    location_text   VARCHAR(255)   NOT NULL,
    location_code   VARCHAR(50)    NOT NULL,
    meeting_place   VARCHAR(255)   NOT NULL,
    category        VARCHAR(50) NULL,
    chat_count      INT            NOT NULL DEFAULT 0,
    like_count      INT            NOT NULL DEFAULT 0, -- ★ [수정됨] 좋아요 수 컬럼 추가
    latitude        DECIMAL(10, 8) NOT NULL,
    longitude       DECIMAL(11, 8) NOT NULL,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,
    CONSTRAINT fk_mp_writer FOREIGN KEY (users_id) REFERENCES users (users_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE market_post_images
(
    market_post_images_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id               BIGINT       NOT NULL,
    image_url             VARCHAR(255) NOT NULL,
    order_index           INT          NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mpi_post FOREIGN KEY (post_id) REFERENCES market_posts (market_posts_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE market_likes
(
    market_likes_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id        BIGINT    NOT NULL,
    post_id         BIGINT    NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ml_user FOREIGN KEY (users_id) REFERENCES users (users_id),
    CONSTRAINT fk_ml_post FOREIGN KEY (post_id) REFERENCES market_posts (market_posts_id),
    CONSTRAINT uk_market_like_user_post UNIQUE (users_id, post_id) -- ★ [수정됨] 중복 좋아요 방지
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE market_comments
(
    market_comments_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id            BIGINT    NOT NULL,
    users_id           BIGINT    NOT NULL,
    content            TEXT NULL,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    parent_id          BIGINT NULL,
    CONSTRAINT fk_mc_post FOREIGN KEY (post_id) REFERENCES market_posts (market_posts_id),
    CONSTRAINT fk_mc_writer FOREIGN KEY (users_id) REFERENCES users (users_id),
    CONSTRAINT fk_mc_parent FOREIGN KEY (parent_id) REFERENCES market_comments (market_comments_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_rooms
(
    chat_rooms_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id         BIGINT    NOT NULL,
    seller_id       BIGINT    NOT NULL,
    buyer_id        BIGINT    NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    last_message    TEXT NULL,
    last_message_at TIMESTAMP NULL,
    CONSTRAINT fk_cr_post FOREIGN KEY (post_id) REFERENCES market_posts (market_posts_id),
    CONSTRAINT fk_cr_seller FOREIGN KEY (seller_id) REFERENCES users (users_id),
    CONSTRAINT fk_cr_buyer FOREIGN KEY (buyer_id) REFERENCES users (users_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_messages
(
    chat_messages_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id          BIGINT    NOT NULL,
    users_id         BIGINT    NOT NULL,
    message          TEXT NULL,
    image_url        VARCHAR(255) NULL,
    is_read          TINYINT(1) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cm_room FOREIGN KEY (room_id) REFERENCES chat_rooms (chat_rooms_id),
    CONSTRAINT fk_cm_sender FOREIGN KEY (users_id) REFERENCES users (users_id)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ai_chat_message
(
    ai_chat_message_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    users_id            BIGINT    NOT NULL,
    recipes_id          BIGINT NULL, -- ★ [수정됨] 레시피 삭제 시 NULL 설정을 위해 NULL 허용
    sender_type         ENUM('USER', 'AI') NOT NULL,
    content             TEXT      NOT NULL,
    recommended_recipes JSON NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_acm_user FOREIGN KEY (users_id) REFERENCES users (users_id),
    CONSTRAINT fk_acm_recipe FOREIGN KEY (recipes_id) REFERENCES recipes (recipes_id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;

-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_ai_chat_user_date ON ai_chat_message (users_id, created_at);
CREATE INDEX idx_ai_chat_user_recipe ON ai_chat_message (users_id, recipes_id);

-- [4] 외래 키 검사 다시 활성화
SET
FOREIGN_KEY_CHECKS = 1;