package com.michelin0.michelinzerostar.domain.user.controller;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.user.dto.request.LocationUpdateRequest;
import com.michelin0.michelinzerostar.domain.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    // 위치 인증/수정 API
    @PutMapping("/location")
    public ResponseEntity<String> updateLocation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody LocationUpdateRequest request) {

        userProfileService.updateLocation(
                userPrincipal.getId(),
                request.getLatitude(),
                request.getLongitude()
        );

        return ResponseEntity.ok("위치 정보가 성공적으로 업데이트되었습니다.");
    }
}