package com.michelin0.michelinzerostar.domain.auth.dto;

import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.entity.UserRole;
import java.util.Map;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Getter
public class OAuthAttributes {

    private Map<String, Object> attributes; // OAuth2 반환하는 유저 정보 Map
    private String nameAttributeKey;
    private String name;
    private String email;
    private String profileImageUrl;
    private SocialProvider socialProvider;
    private String socialId;

    @Builder
    public OAuthAttributes(Map<String, Object> attributes, String nameAttributeKey, String name,
            String email, String profileImageUrl, SocialProvider socialProvider, String socialId) {
        this.attributes = attributes;
        this.nameAttributeKey = nameAttributeKey;
        this.name = name;
        this.email = email;
        this.profileImageUrl = profileImageUrl;
        this.socialProvider = socialProvider;
        this.socialId = socialId;
    }

    // 소셜 서비스(구글)에 맞는 메소드를 호출하여 OAuthAttributes 객체 생성
    public static OAuthAttributes of(String registrationId, String userNameAttributeName,
            Map<String, Object> attributes) {
        // ▼▼▼ [추가] 들어오는 데이터를 로그로 찍어봅니다. (범인 색출!) ▼▼▼
        log.info("로그인 시도: registrationId = {}, attributes = {}", registrationId, attributes);

        if ("google".equals(registrationId)) {
            return ofGoogle(userNameAttributeName, attributes);
        }
        if ("kakao".equals(registrationId)) {
            return ofKakao(userNameAttributeName, attributes);
        }
        if ("naver".equals(registrationId)) {
            return ofNaver(userNameAttributeName, attributes);
        }
        return ofGoogle(userNameAttributeName, attributes);
    }

    private static OAuthAttributes ofGoogle(String userNameAttributeName,
            Map<String, Object> attributes) {
        return OAuthAttributes.builder()
                .name((String) attributes.get("name"))
                .email((String) attributes.get("email"))
                .profileImageUrl((String) attributes.get("picture"))
                .socialProvider(SocialProvider.GOOGLE)
                .socialId((String) attributes.get("sub")) // 구글의 식별자 ID
                .attributes(attributes)
                .nameAttributeKey(userNameAttributeName)
                .build();
    }

    private static OAuthAttributes ofKakao(String userNameAttributeName,
            Map<String, Object> attributes) {
        // 1. kakao_account 꺼내기
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");

        // 2. profile 꺼내기
        Map<String, Object> kakaoProfile = (Map<String, Object>) kakaoAccount.get("profile");

        return OAuthAttributes.builder()
                .name((String) kakaoProfile.get("nickname"))
                .email((String) kakaoAccount.get("email"))
                .profileImageUrl((String) kakaoProfile.get("profile_image_url"))
                .socialProvider(SocialProvider.KAKAO)
                .socialId(String.valueOf(attributes.get("id")))
                .attributes(attributes)
                .nameAttributeKey(userNameAttributeName)
                .build();
    }

    private static OAuthAttributes ofNaver(String userNameAttributeName,
            Map<String, Object> attributes) {
        Map<String, Object> response = (Map<String, Object>) attributes.get("response");
        return OAuthAttributes.builder()
                .name((String) response.get("name"))
                .email((String) response.get("email"))
                .profileImageUrl((String) response.get("profile_image"))
                .socialProvider(SocialProvider.NAVER)
                .socialId((String) response.get("id"))
                .attributes(response) // response를 통째로 넘겨줍니다.
                .nameAttributeKey("id") // 네이버의 PK는 id
                .build();
    }

    // User 엔티티로 변환 (회원가입 시점)
    public User toEntity() {
        return User.builder()
                .name(name)
                .email(email)
                .nickname(name) // 닉네임은 이름과 동일하게 설정 (추후 변경 가능)
                .profileImageUrl(profileImageUrl)
                .role(UserRole.USER) // 가입 시 기본 권한
                .socialProvider(socialProvider)
                .socialId(socialId)
                .totalStar(0.0) // 초기 별점
                .build();
    }
}