package com.michelin0.michelinzerostar.global.security.oauth.service;

import com.michelin0.michelinzerostar.domain.auth.dto.OAuthAttributes;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 구글 등에서 유저 정보 가져오기
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // 서비스 구분 (google, naver 등)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 로그인 시 PK가 되는 필드값 (구글: sub, 네이버: id 등)
        String userNameAttributeName = userRequest.getClientRegistration().getProviderDetails()
                .getUserInfoEndpoint().getUserNameAttributeName();

        // OAuthAttributes: 데이터를 DTO로 변환
        OAuthAttributes attributes = OAuthAttributes.of(registrationId, userNameAttributeName,
                oAuth2User.getAttributes());

        // 유저 저장 또는 업데이트
        User user = saveOrUpdate(attributes);

        Map<String, Object> memberAttributes = new HashMap<>(attributes.getAttributes());

        memberAttributes.put("name", attributes.getName());
        memberAttributes.put("email", attributes.getEmail());
        memberAttributes.put("provider", attributes.getSocialProvider().name());
        // 로그인 성공 리턴
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(user.getRole().getKey())),
                memberAttributes,
                attributes.getNameAttributeKey());
    }

    private User saveOrUpdate(OAuthAttributes attributes) {
        User user = userRepository.findByEmailAndSocialProvider(attributes.getEmail(),
                        attributes.getSocialProvider())
                .map(entity -> {
                    // 업데이트 수행 (void)
                    entity.updateProfile(attributes.getName(), null,
                            attributes.getProfileImageUrl());
                    // 수행 후 엔티티 자신을 반환
                    return entity;
                })
                .orElse(attributes.toEntity()); // 없으면 새로 생성

        return userRepository.save(user);
    }
}