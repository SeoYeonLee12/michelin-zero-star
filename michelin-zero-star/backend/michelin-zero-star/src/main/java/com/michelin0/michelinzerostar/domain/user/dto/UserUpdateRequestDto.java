package com.michelin0.michelinzerostar.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserUpdateRequestDto {

    private String nickname;
    private String profileImageUrl;
    private String currentPassword;    // 현재 비밀번호
    private String newPassword;        // 바꿀 비밀번호
    private String newPasswordConfirm; // 바꿀 비밀번호 확인
}