package com.michelin0.michelinzerostar.global.infra.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@ToString
public class KakaoGeoResponse {

    private Meta meta;
    private List<Document> documents;

    @Getter
    @NoArgsConstructor
    @ToString
    public static class Meta {

        @JsonProperty("total_count")
        private int totalCount;
    }

    @Getter
    @NoArgsConstructor
    @ToString
    public static class Document {

        @JsonProperty("region_type")
        private String regionType;

        // 행정동 코드
        @JsonProperty("code")
        private String code;

        // 전체 주소
        @JsonProperty("address_name")
        private String addressName;
    }
}