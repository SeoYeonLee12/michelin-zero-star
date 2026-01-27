package com.michelin0.michelinzerostar.domain.market.controller;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.market.dto.request.MarketCommentRequest;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketCommentResponse;
import com.michelin0.michelinzerostar.domain.market.service.MarketCommentService;
import com.michelin0.michelinzerostar.domain.market.service.MarketLikeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/market/posts")
@RequiredArgsConstructor
public class MarketFeatureController {

    private final MarketCommentService commentService;
    private final MarketLikeService likeService;

    @PostMapping("/{postId}/comments")
    public ResponseEntity<String> createComment(
            @PathVariable Long postId,
            @RequestBody MarketCommentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        commentService.createComment(userPrincipal.getId(), postId, request);
        return ResponseEntity.ok("댓글이 등록되었습니다.");
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<MarketCommentResponse>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getComments(postId));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<String> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        commentService.deleteComment(userPrincipal.getId(), commentId);
        return ResponseEntity.ok("댓글이 삭제되었습니다.");
    }

    @PostMapping("/{postId}/likes")
    public ResponseEntity<String> toggleLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        boolean isLiked = likeService.toggleLike(userPrincipal.getId(), postId);
        return ResponseEntity.ok(isLiked ? "찜 목록에 추가되었습니다." : "찜 목록에서 삭제되었습니다.");
    }
}