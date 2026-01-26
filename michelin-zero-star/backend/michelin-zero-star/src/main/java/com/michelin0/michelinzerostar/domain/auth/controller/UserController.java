package com.michelin0.michelinzerostar.domain.user.controller;

import com.michelin0.michelinzerostar.domain.user.dto.UserResponseDto;
import com.michelin0.michelinzerostar.domain.user.dto.UserUpdateRequestDto;
import com.michelin0.michelinzerostar.domain.user.entity.SocialProvider;
import com.michelin0.michelinzerostar.domain.user.service.UserService;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    // 회원 탈퇴
    @DeleteMapping("/me")
    public ResponseEntity<String> deleteUser(
            @RequestHeader("Authorization") String accessToken,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String resolvedToken = resolveToken(accessToken);
        SocialProvider provider = SocialProvider.valueOf(
                jwtTokenProvider.getSocialProvider(resolvedToken));

        userService.deleteUser(resolvedToken, userDetails.getUsername(), provider);
        return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
    }

    // 회원 정보 수정
    @PatchMapping("/me")
    public ResponseEntity<String> updateUser(
            @RequestHeader("Authorization") String accessToken,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid UserUpdateRequestDto requestDto
    ) {
        String resolvedToken = resolveToken(accessToken);
        SocialProvider provider = SocialProvider.valueOf(
                jwtTokenProvider.getSocialProvider(resolvedToken));

        userService.updateUser(userDetails.getUsername(), provider, requestDto);
        return ResponseEntity.ok("회원 정보가 수정되었습니다.");
    }

    // 내 정보 조회
    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getMyInfo(
            @RequestHeader("Authorization") String accessToken,
            @AuthenticationPrincipal UserDetails userDetails) {

        String resolvedToken = resolveToken(accessToken);
        SocialProvider provider = SocialProvider.valueOf(
                jwtTokenProvider.getSocialProvider(resolvedToken));

        UserResponseDto responseDto = userService.getUser(userDetails.getUsername(), provider);
        return ResponseEntity.ok(responseDto);
    }

    // 위치
    @PostMapping("/location")
    public ResponseEntity<String> verifyLocation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody LocationRequestDto requestDto
    ) {
        String dongName = userService.updateUserLocation(
                userDetails.getUsername(), // 이메일
                requestDto.getLatitude(),
                requestDto.getLongitude()
        );

        return ResponseEntity.ok("현재 위치 '" + dongName + "' 인증이 완료되었습니다.");
    }

    private String resolveToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return token;
    }

    @Getter
    @NoArgsConstructor
    public static class LocationRequestDto {

        private Double latitude;
        private Double longitude;
    }
}