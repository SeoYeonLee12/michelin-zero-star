package com.michelin0.michelinzerostar.global.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class KakaoMapService {

    private final RestTemplate restTemplate;

    @Value("${kakao.rest-api-key}")
    private String kakaoRestApiKey;

    private static final String KAKAO_API_URL = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json";

    public AddressInfo getAddressFromCoords(BigDecimal latitude, BigDecimal longitude) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        String url = String.format("%s?x=%s&y=%s", KAKAO_API_URL, longitude, latitude);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity,
                String.class);
        try {
            String responseBody = response.getBody();
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode documents = root.path("documents");

            if (documents.isArray() && documents.size() > 0) {
                for (JsonNode doc : documents) {
                    if ("H".equals(doc.path("region_type").asText())) {
                        String dongName = doc.path("region_3depth_name").asText();
                        String code = doc.path("code").asText();

                        return new AddressInfo(dongName, code, dongName);
                    }
                }
            }
            throw new RuntimeException("행정동 정보를 찾을 수 없습니다.");

        } catch (Exception e) {
            log.error("카카오 API 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("주소 변환에 실패했습니다.");
        }
    }

    public record AddressInfo(String fullAddress, String code, String dongName) {

    }
}