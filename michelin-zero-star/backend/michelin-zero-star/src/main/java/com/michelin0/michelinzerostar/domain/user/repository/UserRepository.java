package com.michelin0.michelinzerostar.domain.user.repository;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일로 회원 조회 (로그인, 중복 가입 체크용)
    Optional<User> findByEmail(String email);

    // 닉네임 중복 체크용 (필요 시 사용)
    boolean existsByNickname(String nickname);
}