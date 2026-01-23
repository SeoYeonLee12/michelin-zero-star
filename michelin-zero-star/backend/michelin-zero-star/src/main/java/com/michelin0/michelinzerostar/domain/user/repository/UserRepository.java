package com.michelin0.michelinzerostar.domain.user.repository;

import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일과 소셜제공자 두 개를 다 만족해야 찾음 (로그인, 회원수정 시 사용)
    Optional<User> findByEmailAndSocialProvider(String email, SocialProvider socialProvider);

    // 이메일로 유저 찾기
    Optional<User> findByEmail(String email);

    // 이메일 중복 검사 시 사용
    boolean existsByEmail(String email);

    // 닉네임 중복 검사
    boolean existsByNickname(String nickname);
}