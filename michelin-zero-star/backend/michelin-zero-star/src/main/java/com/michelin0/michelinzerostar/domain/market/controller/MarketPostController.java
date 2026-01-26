package com.michelin0.michelinzerostar.domain.market.controller;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostCreateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostUpdateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostDetailResponse;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostListResponse;
import com.michelin0.michelinzerostar.domain.market.service.MarketPostService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor
public class MarketPostController {

    private final MarketPostService marketPostService;

    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> createPost(
            @RequestPart(value = "post") MarketPostCreateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        marketPostService.createPost(userPrincipal.getId(), request, images);
        return ResponseEntity.ok("게시글이 등록 되었습니다.");
    }

    @GetMapping("/posts")
    public ResponseEntity<List<MarketPostListResponse>> getPostList() {
        return ResponseEntity.ok(marketPostService.findAllPosts());
    }

    @GetMapping("/posts/nearby")
    public ResponseEntity<List<MarketPostListResponse>> getNearbyPosts(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "5") double km // 기본값 5km
    ) {
        List<MarketPostListResponse> posts = marketPostService.findNearbyPosts(
                userPrincipal.getId(), km);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<MarketPostDetailResponse> getPostDetail(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long userId = (userPrincipal != null) ? userPrincipal.getId() : null;
        return ResponseEntity.ok(marketPostService.getPostDetail(postId, userId));
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<String> updatePost(
            @PathVariable Long postId,
            @RequestBody MarketPostUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        marketPostService.updatePost(postId, userPrincipal.getId(), request);
        return ResponseEntity.ok("게시글이 업데이트 되었습니다.");
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<String> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        marketPostService.deletePost(postId, userPrincipal.getId());
        return ResponseEntity.ok("게시글이 삭제 되었습니다.");
    }
}