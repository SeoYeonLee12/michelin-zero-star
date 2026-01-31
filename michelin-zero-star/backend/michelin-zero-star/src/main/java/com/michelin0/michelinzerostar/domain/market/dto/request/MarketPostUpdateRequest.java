package com.michelin0.michelinzerostar.domain.market.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MarketPostUpdateRequest {

    private String title;
    private String content;
    private int price;
    private String meetingPlace;
    private String category;
}