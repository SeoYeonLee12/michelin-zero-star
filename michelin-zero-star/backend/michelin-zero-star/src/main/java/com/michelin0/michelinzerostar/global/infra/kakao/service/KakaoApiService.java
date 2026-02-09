package com.michelin0.michelinzerostar.global.infra.kakao.service;

import com.michelin0.michelinzerostar.global.infra.kakao.dto.KakaoGeoResponse;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoApiService {

    private final RestTemplate restTemplate;

    @Value("${kakao.rest-api-key}")
    private String restApiKey;

    private static final String KAKAO_GEO_URL = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json";
    
    public KakaoGeoResponse.Document getRegionInfo(BigDecimal latitude, BigDecimal longitude) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + restApiKey);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = String.format("%s?x=%s&y=%s", KAKAO_GEO_URL, longitude, latitude);

        try {
            ResponseEntity<KakaoGeoResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    KakaoGeoResponse.class
            );

            KakaoGeoResponse body = response.getBody();
            if (body == null || body.getDocuments().isEmpty()) {
                throw new RuntimeException("Kakao API 응답이 없거나 비어있습니다.");
            }

            return body.getDocuments().stream()
                    .filter(doc -> "H".equals(doc.getRegionType()))
                    .findFirst()
                    .orElse(body.getDocuments().get(0));

        } catch (Exception e) {
            log.error("Kakao API 호출 실패: {}", e.getMessage());
            throw new RuntimeException("위치 정보를 가져오는 데 실패했습니다.");
        }
    }
}