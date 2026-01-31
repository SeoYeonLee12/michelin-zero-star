package com.michelin0.michelinzerostar.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // application.yml에서 설정을 가져옴 (운영체제별로 경로를 다르게 하기 위해)
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 브라우저에서 http://서버주소/images/abc.jpg 로 요청하면 실제 로컬 경로의 파일(uploadDir)을 보여줌
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:///" + uploadDir + "/"); // 윈도우는 file:/// 필수
    }
}