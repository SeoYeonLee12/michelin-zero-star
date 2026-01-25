package com.michelin0.michelinzerostar.domain.user.repository;

import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    default User getById(Long userId) {
        return findById(userId).orElseThrow(
                () -> new GlobalException(UserErrorCode.USER_NOT_FOUND));
    }

    Optional<User> findById(Long userId);

    // 이메일 AND 소셜제공자 두 개를 다 만족해야 찾음
    Optional<User> findByEmailAndSocialProvider(String email, SocialProvider socialProvider);

    Optional<User> findByEmail(String email);
}