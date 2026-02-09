package com.michelin0.michelinzerostar.domain.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserRole {
    USER("ROLE_USER", "일반 사용자");

    private final String key;
    private final String title;
}
