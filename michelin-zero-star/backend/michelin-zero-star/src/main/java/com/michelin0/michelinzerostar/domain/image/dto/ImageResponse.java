package com.michelin0.michelinzerostar.domain.image.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ImageResponse {
    private String imageUrl; // 예: "/images/uuid_filename.jpg"
}