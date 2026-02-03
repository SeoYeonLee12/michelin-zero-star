package com.michelin0.michelinzerostar.domain.market.service;

import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostCreateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.request.MarketPostUpdateRequest;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostDetailResponse;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketPostListResponse;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPostImage;
import com.michelin0.michelinzerostar.domain.market.entity.PostStatus;
import com.michelin0.michelinzerostar.domain.market.repository.MarketPostRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.entity.UserProfile;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.MarketErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MarketPostService {

    private final MarketPostRepository marketPostRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // 게시글 생성
    @Transactional
    public void createPost(Long userId, MarketPostCreateRequest request, List<MultipartFile> images) {
        User writer = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        UserProfile profile = writer.getUserProfile();
        if (profile == null) {
            log.warn("글 작성 실패: 유저(ID={})가 동네 인증을 하지 않았습니다.", userId);
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

        uploadImages(post, images); // 이미지 업로드

        marketPostRepository.save(post);
    }

    // 게시글 상세 조회
    public MarketPostDetailResponse getPostDetail(Long postId, Long currentUserId) {
        return marketPostRepository.findByIdWithWriter(postId)
                .map(post -> new MarketPostDetailResponse(post, currentUserId))
                .orElseGet(() -> {
                    MarketPost deletedPost = marketPostRepository.findByIdIncludeDeleted(postId)
                            .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

                    if (deletedPost.getDeletedAt() != null) {
                        throw new GlobalException(MarketErrorCode.ALREADY_DELETED_POST);
                    }
                    throw new GlobalException(MarketErrorCode.POST_NOT_FOUND);
                });
    }

    // 전체 게시글 조회
    public List<MarketPostListResponse> findAllPosts() {
        return marketPostRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(MarketPostListResponse::new)
                .collect(Collectors.toList());
    }

    // 내가 쓴 게시물 조회
    public Page<MarketPostListResponse> getMyPosts(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        return marketPostRepository.findAllByWriterOrderByCreatedAtDesc(user, pageable)
                .map(MarketPostListResponse::new);
    }

    // 내 근처 게시글 조회
    public List<MarketPostListResponse> findNearbyPosts(Long userId, double kmRadius) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        UserProfile profile = user.getUserProfile();
        if (profile == null) {
            throw new GlobalException(MarketErrorCode.LOCATION_AUTH_REQUIRED);
        }

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

    // 게시글 내용 수정
    @Transactional
    public void updatePost(Long postId, Long userId, MarketPostUpdateRequest request, List<MultipartFile> newImages) {
        MarketPost post = marketPostRepository.findById(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

        validateWriter(post, userId);

        post.update(request.getTitle(), request.getContent(), request.getPrice(), request.getMeetingPlace());

        if (newImages != null && !newImages.isEmpty()) {
            deletePostImages(post); // 기존 이미지 삭제
            uploadImages(post, newImages); // 새 이미지 업로드
        }
    }

    // 게시글 상태 수정
    @Transactional
    public void updatePostStatus(Long postId, Long userId, String statusStr) {
        MarketPost post = marketPostRepository.findById(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

        validateWriter(post, userId);

        try {
            PostStatus newStatus = PostStatus.valueOf(statusStr.toUpperCase());
            post.updateStatus(newStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 상태 값입니다. (SELLING, RESERVED, SOLD)");
        }
    }

    // 게시글 삭제
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

    // 내가 찜한 게시글 목록 조회
    public List<MarketPostListResponse> getMyLikedPosts(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new GlobalException(UserErrorCode.USER_NOT_FOUND);
        }
        return marketPostRepository.findLikedPostsByUserId(userId).stream()
                .map(MarketPostListResponse::new)
                .collect(Collectors.toList());
    }

    // 권한 검증
    private void validateWriter(MarketPost post, Long userId) {
        if (!post.getWriter().getId().equals(userId)) {
            log.warn("권한 없는 수정 시도: PostID={}, LoginUserID={}", post.getId(), userId);
            throw new GlobalException(MarketErrorCode.NOT_POST_OWNER);
        }
    }

    // 내부 이미지 업로드 로직
    private void uploadImages(MarketPost post, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) return;

        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        for (int i = 0; i < images.size(); i++) {
            MultipartFile file = images.get(i);
            if (file.isEmpty()) continue;

            String originalFilename = file.getOriginalFilename();
            String ext = extractExt(originalFilename);
            validateExtension(ext);

            String storeFileName = UUID.randomUUID() + "." + ext;
            String fullPath = Paths.get(uploadDir, storeFileName).toString();

            try {
                file.transferTo(new File(fullPath));
                MarketPostImage image = MarketPostImage.builder()
                        .imageUrl("/images/" + storeFileName)
                        .orderIndex(i)
                        .build();
                post.addImage(image);
            } catch (IOException e) {
                log.error("이미지 저장 중 오류 발생: {}", e.getMessage());
                throw new RuntimeException("이미지 저장 중 오류가 발생했습니다.", e);
            }
        }
    }

    // 기존 이미지 삭제 로직
    private void deletePostImages(MarketPost post) {
        for (MarketPostImage img : post.getImages()) {
            try {
                String fileName = img.getImageUrl().replace("/images/", "");
                File file = new File(Paths.get(uploadDir, fileName).toString());
                if (file.exists()) {
                    file.delete();
                }
            } catch (Exception e) {
                log.warn("이미지 파일 삭제 실패: {}", img.getImageUrl());
            }
        }
        post.getImages().clear();
    }

    private String extractExt(String originalFilename) {
        int pos = originalFilename.lastIndexOf(".");
        if (pos == -1) return "";
        return originalFilename.substring(pos + 1).toLowerCase();
    }

    private void validateExtension(String ext) {
        String[] allowedExts = {"jpg", "jpeg", "png"};
        if (!Arrays.asList(allowedExts).contains(ext)) {
            throw new RuntimeException("허용되지 않는 파일 형식입니다: " + ext);
        }
    }
}