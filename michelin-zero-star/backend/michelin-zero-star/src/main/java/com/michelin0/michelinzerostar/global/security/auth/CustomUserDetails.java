package com.michelin0.michelinzerostar.global.security.auth;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.Collection;
import java.util.Collections;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;

    // 권한 반환 (UserRole Enum의 Key 값 사용)
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(new SimpleGrantedAuthority(user.getRole().getKey()));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    // 우리는 ID 대신 Email을 식별자로 사용함
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    // 계정 만료 여부 (true = 만료 안됨)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // 계정 잠김 여부 (true = 잠김 안됨)
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // 자격 증명(비번) 만료 여부 (true = 만료 안됨)
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // 계정 활성화 여부 (true = 활성화)
    @Override
    public boolean isEnabled() {
        return true;
    }

    public User getUser() {
        return user;
    }
}