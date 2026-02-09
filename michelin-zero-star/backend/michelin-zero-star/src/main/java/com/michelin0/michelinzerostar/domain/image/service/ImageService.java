package com.michelin0.michelinzerostar.domain.image.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    // [1] 단일 파일 저장
    public String saveImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String originalFilename = file.getOriginalFilename();
        String ext = extractExt(originalFilename);
        validateExtension(ext);

        String storeFileName = UUID.randomUUID() + "." + ext;
        String fullPath = Paths.get(uploadDir, storeFileName).toString();

        try {
            file.transferTo(new File(fullPath));
            return "/images/" + storeFileName;
        } catch (IOException e) {
            throw new RuntimeException("이미지 저장 실패", e);
        }
    }

    // [2] ★ 다중 파일 저장 (추가된 부분)
    public List<String> saveImages(List<MultipartFile> files) {
        List<String> imageUrls = new ArrayList<>();

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    // 위의 단일 저장 메서드를 재사용
                    String url = saveImage(file);
                    imageUrls.add(url);
                }
            }
        }
        return imageUrls;
    }

    private String extractExt(String originalFilename) {
        if (originalFilename == null) return "";
        int pos = originalFilename.lastIndexOf(".");
        if (pos == -1) return "";
        return originalFilename.substring(pos + 1).toLowerCase();
    }

    private void validateExtension(String ext) {
        String[] allowedExts = {"jpg", "jpeg", "png", "gif", "webp"};
        if (!Arrays.asList(allowedExts).contains(ext)) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다.");
        }
    }
}