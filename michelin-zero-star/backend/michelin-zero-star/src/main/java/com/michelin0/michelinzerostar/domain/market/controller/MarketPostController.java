package com.michelin0.michelinzerostar.domain.market.controller;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostCreateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostStatusUpdateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostUpdateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostDetailResponse;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostListResponse;
import com.michelin0.michelinzerostar.domain.market.service.MarketPostService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor
public class MarketPostController {

    private final MarketPostService marketPostService;

    // 게시글 등록
    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> createPost(
            @RequestPart(value = "post") @Valid MarketPostCreateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        marketPostService.createPost(userPrincipal.getId(), request, images);
        return ResponseEntity.ok("게시글이 등록 되었습니다.");
    }

    // 전체 게시글 조회
    @GetMapping("/posts")
    public ResponseEntity<List<MarketPostListResponse>> getPostList() {
        return ResponseEntity.ok(marketPostService.findAllPosts());
    }

    // 내 근처 게시글 조회
    @GetMapping("/posts/nearby")
    public ResponseEntity<List<MarketPostListResponse>> getNearbyPosts(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "5") double km // 기본값 5km
    ) {
        List<MarketPostListResponse> posts = marketPostService.findNearbyPosts(
                userPrincipal.getId(), km);
        return ResponseEntity.ok(posts);
    }

    // 게시글 상세 조회
    @GetMapping("/posts/{postId}")
    public ResponseEntity<MarketPostDetailResponse> getPostDetail(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long userId = (userPrincipal != null) ? userPrincipal.getId() : null;
        return ResponseEntity.ok(marketPostService.getPostDetail(postId, userId));
    }

    // 게시글 내용 수정 (이미지 포함)
    @PutMapping(value = "/posts/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updatePost(
            @PathVariable Long postId,
            @RequestPart(value = "post") @Valid MarketPostUpdateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        marketPostService.updatePost(postId, userPrincipal.getId(), request, images);
        return ResponseEntity.ok("게시글이 업데이트 되었습니다.");
    }

    // 게시글 상태 수정 (판매중/거래완료 등)
    @PatchMapping("/posts/{postId}/status")
    public ResponseEntity<String> updatePostStatus(
            @PathVariable Long postId,
            @RequestBody MarketPostStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        marketPostService.updatePostStatus(postId, userPrincipal.getId(), request.getStatus());
        return ResponseEntity.ok("게시글 상태가 변경되었습니다.");
    }

    // 게시글 삭제
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<String> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        marketPostService.deletePost(postId, userPrincipal.getId());
        return ResponseEntity.ok("게시글이 삭제 되었습니다.");
    }

    // 내가 찜한 게시글 목록 조회
    @GetMapping("/liked")
    public ResponseEntity<List<MarketPostListResponse>> getMyLikedPosts(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<MarketPostListResponse> response =
                marketPostService.getMyLikedPosts(userPrincipal.getId());
        return ResponseEntity.ok(response);
    }
}