package com.michelin0.michelinzerostar.domain.market.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MarketPostStatusUpdateRequest {
    private String status; // "SELLING", "RESERVED", "SOLD"
}