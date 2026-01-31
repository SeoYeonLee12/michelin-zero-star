package com.michelin0.michelinzerostar.domain.user.dto.request;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class LocationUpdateRequest {

    private BigDecimal latitude;
    private BigDecimal longitude;
}