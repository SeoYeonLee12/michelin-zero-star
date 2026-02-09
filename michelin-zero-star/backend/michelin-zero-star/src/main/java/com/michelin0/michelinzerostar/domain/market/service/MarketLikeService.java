package com.michelin0.michelinzerostar.domain.market.service;

import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostListResponse; // ★ 추가됨
import com.michelin0.michelinzerostar.domain.market.entity.MarketLike;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.market.repository.MarketLikeRepository;
import com.michelin0.michelinzerostar.domain.market.repository.MarketPostRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.MarketErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List; // ★ 추가됨
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MarketLikeService {

    private final MarketLikeRepository likeRepository;
    private final MarketPostRepository postRepository;
    private final UserRepository userRepository;

    public boolean toggleLike(Long userId, Long postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        MarketPost post = postRepository.findById(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

        Optional<MarketLike> existingLike = likeRepository.findByUserAndMarketPost(user, post);

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            post.decreaseLikeCount();
            return false;
        } else {
            likeRepository.save(MarketLike.builder().user(user).marketPost(post).build());
            post.increaseLikeCount();
            return true;
        }
    }

    // 해당 게시글의 좋아요 수 조회
    @Transactional(readOnly = true)
    public long getLikeCount(Long postId) {
        MarketPost post = postRepository.findById(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));
        return likeRepository.countByMarketPost(post);
    }

    // 내가 찜한 게시글 목록 조회
    @Transactional(readOnly = true)
    public List<MarketPostListResponse> getMyLikedPosts(Long userId) {
        List<MarketLike> likes = likeRepository.findAllByUserIdOrderByCreatedAtDesc(userId);

        return likes.stream()
                .map(like -> new MarketPostListResponse(like.getMarketPost()))
                .collect(Collectors.toList());
    }
}