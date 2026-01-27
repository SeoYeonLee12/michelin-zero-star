package com.michelin0.michelinzerostar.domain.market.service;

import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostCreateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostUpdateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostDetailResponse;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostListResponse;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPostImage;
import com.michelin0.michelinzerostar.domain.market.repository.MarketPostRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.entity.UserProfile;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.MarketErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MarketPostService {

    private final MarketPostRepository marketPostRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createPost(Long userId, MarketPostCreateRequest request,
            List<MultipartFile> images) {
        User writer = userRepository.findById(userId)
                .orElseThrow(
                        () -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        UserProfile profile = writer.getUserProfile();

        if (profile == null) {
            throw new GlobalException(MarketErrorCode.LOCATION_AUTH_REQUIRED);
        }

        MarketPost post = MarketPost.builder()
                .writer(writer)
                .title(request.getTitle())
                .content(request.getContent())
                .price(request.getPrice())
                .meetingPlace(request.getMeetingPlace())
                .category(request.getCategory())
                .locationText(profile.getLocationAddress())
                .locationCode(profile.getLocationCode())
                .latitude(profile.getLatitude())
                .longitude(profile.getLongitude())
                .build();

        if (images != null && !images.isEmpty()) {
            for (int i = 0; i < images.size(); i++) {
                String originalFilename = images.get(i).getOriginalFilename();
                MarketPostImage image = MarketPostImage.builder()
                        .imageUrl("/" + originalFilename)
                        .orderIndex(i)
                        .build();
                post.addImage(image);
            }
        }
        marketPostRepository.save(post);
    }

    public List<MarketPostListResponse> findAllPosts() {
        return marketPostRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(MarketPostListResponse::new)
                .collect(Collectors.toList());
    }

    public List<MarketPostListResponse> findNearbyPosts(Long userId, double kmRadius) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        UserProfile profile = user.getUserProfile();
        // 동네 인증을 안 해서 좌표가 없는 경우 에러 처리
        if (profile == null) {
            throw new GlobalException(MarketErrorCode.LOCATION_AUTH_REQUIRED);
        }

        // km 단위를 미터(m) 단위로 변환 (예: 5km -> 5000m)
        double radiusInMeters = kmRadius * 1000;

        List<MarketPost> posts = marketPostRepository.findNearbyPosts(
                profile.getLatitude(),
                profile.getLongitude(),
                radiusInMeters
        );

        return posts.stream()
                .map(MarketPostListResponse::new)
                .collect(Collectors.toList());
    }

    public MarketPostDetailResponse getPostDetail(Long postId, Long currentUserId) {
        return marketPostRepository.findById(postId)
                .map(post -> new MarketPostDetailResponse(post, currentUserId))
                .orElseGet(() -> {
                    MarketPost deletedPost = marketPostRepository.findByIdIncludeDeleted(postId)
                            .orElseThrow(() -> new GlobalException(
                                    MarketErrorCode.POST_NOT_FOUND));

                    if (deletedPost.getDeletedAt() != null) {
                        throw new GlobalException(MarketErrorCode.ALREADY_DELETED_POST);
                    }

                    throw new GlobalException(MarketErrorCode.POST_NOT_FOUND);
                });
    }

    @Transactional
    public void updatePost(Long postId, Long userId, MarketPostUpdateRequest request) {
        MarketPost post = marketPostRepository.findById(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

        validateWriter(post, userId);

        post.update(request.getTitle(), request.getContent(), request.getPrice(),
                request.getMeetingPlace());
    }

    @Transactional
    public void deletePost(Long postId, Long userId) {
        MarketPost post = marketPostRepository.findByIdIncludeDeleted(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

        validateWriter(post, userId);

        if (post.getDeletedAt() != null) {
            throw new GlobalException(MarketErrorCode.ALREADY_DELETED_POST);
        }

        marketPostRepository.delete(post);
    }

    private void validateWriter(MarketPost post, Long userId) {
        if (!post.getWriter().getId().equals(userId)) {
            throw new GlobalException(MarketErrorCode.NOT_POST_OWNER);
        }
    }
}