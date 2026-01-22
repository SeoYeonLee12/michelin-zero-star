package com.michelin0.michelinzerostar.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserUpdateRequestDto {

    // 프로필 정보
    private String name;
    private String nickname;

    // 비밀번호 변경 관련 (선택 사항이므로 Null 허용, 하지만 값을 보내면 검증 로직 타게 함)
    private String currentPassword;    // 현재 비밀번호 (기존 checkPassword에서 이름 변경 추천)
    private String newPassword;        // 바꿀 비밀번호
    private String newPasswordConfirm; // 바꿀 비밀번호 확인 (추가됨)
}
