package com.michelin0.michelinzerostar.domain.user.service;

import com.michelin0.michelinzerostar.domain.user.entity.UserProfile;
import com.michelin0.michelinzerostar.domain.user.repository.UserProfileRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import com.michelin0.michelinzerostar.global.infra.kakao.dto.KakaoGeoResponse;
import com.michelin0.michelinzerostar.global.infra.kakao.service.KakaoApiService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final KakaoApiService kakaoApiService;

    public void updateLocation(Long userId, BigDecimal latitude, BigDecimal longitude) {
        KakaoGeoResponse.Document regionInfo = kakaoApiService.getRegionInfo(latitude, longitude);

        UserProfile userProfile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        userProfile.updateLocation(
                regionInfo.getAddressName(),
                regionInfo.getCode(),
                latitude,
                longitude
        );
    }
}