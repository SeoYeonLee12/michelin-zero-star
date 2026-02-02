package com.michelin0.michelinzerostar.global.config;

import java.io.File;
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
        // 절대 경로를 URL 형식으로 안전하게 변환
        String path = new File(uploadDir).getAbsolutePath();

        // 브라우저에서 /images/파일명 으로 요청하면 로컬 업로드 경로의 파일을 보여줌
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:///" + path + "/"); // 윈도우/리눅스 호환을 위해 절대경로 사용
    }
}