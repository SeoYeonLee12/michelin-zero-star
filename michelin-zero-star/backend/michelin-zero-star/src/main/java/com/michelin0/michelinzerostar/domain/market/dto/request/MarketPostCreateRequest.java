package com.michelin0.michelinzerostar.domain.market.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MarketPostCreateRequest {

    @NotBlank(message = "제목은 필수 입력값입니다.")
    @Size(min = 2, max = 40, message = "제목은 2자 이상 40자 이하로 입력해주세요.")
    private String title;

    @NotBlank(message = "내용은 필수 입력값입니다.")
    @Size(min = 5, max = 150, message = "내용은 5자 이상 150자 이하로 상세히 작성해주세요.")
    private String content;

    @NotNull(message = "가격은 필수 입력값입니다.")
    @Min(value = 0, message = "가격은 0원 이상이어야 합니다.") // 0원 전송 시 프론트에서 '나눔' 블록 처리
    private Integer price;

    @Size(max = 30, message = "거래 장소는 30자 이내로 입력해주세요.")
    private String meetingPlace;
}