package com.michelin0.michelinzerostar.domain.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "user_profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @Column(name = "users_id")
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id")
    private User user;

    @Column(name = "location_address")
    private String locationAddress; // 예: 대전 서구 둔산동

    @Column(name = "location_code")
    private String locationCode; // 행정동 코드 (필터링 핵심 키)

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified; // 동네 인증 여부

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;


    @Builder
    public void updateLocation(String locationAddress, String locationCode, BigDecimal latitude,
            BigDecimal longitude) {
        this.locationAddress = locationAddress;
        this.locationCode = locationCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.isVerified = true;
    }
}