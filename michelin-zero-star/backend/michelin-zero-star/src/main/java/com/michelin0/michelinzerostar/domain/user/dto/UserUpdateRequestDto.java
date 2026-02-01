package com.michelin0.michelinzerostar.domain.user.dto;

import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserUpdateRequestDto {
    private String nickname;
    private String profileImageUrl;
    private String currentPassword;
    private String newPassword;
    private String newPasswordConfirm;

    private List<String> categories;
}