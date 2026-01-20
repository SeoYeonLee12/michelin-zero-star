package com.michelin0.michelinzerostar.domain.user.entity;

import com.michelin0.michelinzerostar.global.entity.SoftDeleteDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends SoftDeleteDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "users_id")
    private Long id;

    @Column(nullable = false, length = 255) // 이메일
    private String email;

    @Column(length = 255) // 비밀번호 (소셜 로그인은 null 가능하므로 nullable 허용)
    private String password;

    @Column(nullable = false, length = 100) // 이름
    private String name;

    @Column(nullable = false, length = 100) // 닉네임
    private String nickname;

    @Column(name = "profile_image_url", length = 255) // 프로필 이미지
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // USER

    @Enumerated(EnumType.STRING)
    @Column(name = "social_provider")
    private SocialProvider socialProvider; // KAKAO, NAVER, GOOGLE

    @Column(name = "social_id")
    private String socialId; // 소셜 로그인 고유 ID

    @Column(name = "total_star", nullable = false)
    private Double totalStar; // 누적 미슐랭 스타

    @Builder
    public User(String email, String password, String name, String nickname,
            String profileImageUrl, UserRole role, SocialProvider socialProvider,
            String socialId, Double totalStar) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.role = role;
        this.socialProvider = socialProvider;
        this.socialId = socialId;
        this.totalStar = (totalStar != null) ? totalStar : 0.0;
    }

    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }
}