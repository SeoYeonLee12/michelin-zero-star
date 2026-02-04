package com.michelin0.michelinzerostar.domain.image.controller;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.image.dto.ImageResponse;
import com.michelin0.michelinzerostar.domain.image.service.ImageService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    // 단일 업로드
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageResponse> uploadImage(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String imageUrl = imageService.saveImage(file);
        return ResponseEntity.ok(new ImageResponse(imageUrl));
    }

    // 다중 업로드
    @PostMapping(value = "/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<String>> uploadImages(
            @RequestPart("files") List<MultipartFile> files, // "files"라는 이름으로 받음
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<String> imageUrls = imageService.saveImages(files);
        return ResponseEntity.ok(imageUrls);
    }
}