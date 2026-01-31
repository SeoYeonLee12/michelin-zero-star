package com.michelin0.michelinzerostar.domain.user.dto;

import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponseDto {

    private Long id;
    private String email;
    private String name;
    private String nickname;
    private String profileImageUrl;
    private UserRole role;
    private Double totalStar;
    private SocialProvider socialProvider;
    private String location;
    private boolean isVerified;

    public UserResponseDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.nickname = user.getNickname();
        this.profileImageUrl = user.getProfileImageUrl();
        this.role = user.getRole();
        this.totalStar = user.getTotalStar();
        this.socialProvider = user.getSocialProvider();
        this.isVerified = false;
        this.location = null;
    }
}