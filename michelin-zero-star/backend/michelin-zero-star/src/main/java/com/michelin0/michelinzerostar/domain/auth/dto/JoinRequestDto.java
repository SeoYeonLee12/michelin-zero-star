package com.michelin0.michelinzerostar.domain.auth.dto;

import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;

@Getter
@NoArgsConstructor
public class JoinRequestDto {

    @NotBlank(message = "이메일은 필수 입력 값입니다.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Size(max = 50, message = "이메일은 최대 50자까지 입력 가능합니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수 입력 값입니다.")
    // 화면 가이드 반영: 8~20자, 영문, 숫자, 특수문자 포함
    @Size(min = 8, max = 20, message = "비밀번호는 8자 이상 20자 이하로 입력해주세요.")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,20}$",
            message = "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.")
    private String password;

    @NotBlank(message = "이름은 필수 입력 값입니다.")
    @Size(min = 2, max = 10, message = "이름은 2자 이상 10자 이하로 입력해주세요.")
    private String name;

    @NotBlank(message = "닉네임은 필수 입력 값입니다.")
    @Size(min = 2, max = 12, message = "닉네임은 2자 이상 12자 이하로 입력해주세요.")
    private String nickname;

    // DTO -> Entity 변환 메서드 (비밀번호 암호화 포함)
    public User toEntity(PasswordEncoder passwordEncoder) {
        return User.builder()
                .email(email)
                .password(passwordEncoder.encode(password)) // 비밀번호 암호화
                .name(name)
                .nickname(nickname)
                .role(UserRole.USER) // 가입 시 기본 권한은 USER
                .socialProvider(SocialProvider.LOCAL)
                .build();
    }
}