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
    public void createPost(Long userId, MarketPostCreateRequest request,
            List<MultipartFile> images) {
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
                .price(request.getPrice()) // 0원일 경우 나눔 처리
                .meetingPlace(request.getMeetingPlace())
                .locationText(profile.getLocationAddress())
                .locationCode(profile.getLocationCode())
                .latitude(profile.getLatitude())
                .longitude(profile.getLongitude())
                .build();

        uploadImages(post, images);

        marketPostRepository.save(post);
        log.info("게시글 등록 완료: ID={}, Title={}, Price={}", post.getId(), post.getTitle(),
                post.getPrice());
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

    // 게시글 수정
    @Transactional
    public void updatePost(Long postId, Long userId, MarketPostUpdateRequest request,
            List<MultipartFile> images, List<String> existingImageUrls) {
        MarketPost post = marketPostRepository.findById(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

        validateWriter(post, userId);

        post.update(request.getTitle(), request.getContent(), request.getPrice(),
                request.getMeetingPlace());

        // 1. 기존 이미지 중 삭제된 것 제거
        List<MarketPostImage> currentImages = post.getImages();
        
        // existingImageUrls가 null이면 빈 리스트로 처리 (전체 삭제 의도일 수 있음)
        List<String> validExistingUrls = existingImageUrls != null ? existingImageUrls : List.of();

        // 유지할 이미지만 남기고, 삭제될 이미지는 파일 시스템에서도 삭제
        currentImages.removeIf(img -> {
            if (!validExistingUrls.contains(img.getImageUrl())) {
                deleteFile(img.getImageUrl());
                return true;
            }
            return false;
        });

        // 2. 새로운 이미지 추가
        if (images != null && !images.isEmpty()) {
            uploadImages(post, images);
        }

        // 3. 순서 재정렬 (기존 이미지 순서 유지 + 새 이미지 뒤에 추가)
        // 만약 기존 이미지 순서를 existingImageUrls 순서대로 하고 싶다면 별도 로직 필요
        // 현재 로직: 기존 이미지 -> 새 이미지 순
        for (int i = 0; i < currentImages.size(); i++) {
            currentImages.get(i).updateOrderIndex(i);
        }
        
        log.info("게시글 수정 완료: ID={}", post.getId());
    }

    private void deleteFile(String imageUrl) {
        try {
            File file = new File(
                    Paths.get(uploadDir, imageUrl.replace("/images/", "")).toString());
            if (file.exists()) {
                file.delete();
            }
        } catch (Exception e) {
            log.error("파일 삭제 실패: {}", imageUrl, e);
        }
    }

    // 내가 쓴 게시물 조회
    public Page<MarketPostListResponse> getMyPosts(Long userId, Pageable pageable) {
        return marketPostRepository.findAllByWriterIdOrderByCreatedAtDesc(userId, pageable)
                .map(MarketPostListResponse::new);
    }

    // 상태 수정
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

    // 삭제
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

    // 찜 목록 조회
    public List<MarketPostListResponse> getMyLikedPosts(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new GlobalException(UserErrorCode.USER_NOT_FOUND);
        }
        return marketPostRepository.findLikedPostsByUserId(userId).stream()
                .map(MarketPostListResponse::new)
                .collect(Collectors.toList());
    }

    private void validateWriter(MarketPost post, Long userId) {
        if (!post.getWriter().getId().equals(userId)) {
            throw new GlobalException(MarketErrorCode.NOT_POST_OWNER);
        }
    }

    private void uploadImages(MarketPost post, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        for (int i = 0; i < images.size(); i++) {
            MultipartFile file = images.get(i);
            if (file == null || file.isEmpty()) {
                continue;
            }

            String ext = extractExt(file.getOriginalFilename());
            validateExtension(ext);

            String storeFileName = UUID.randomUUID() + "." + ext;
            try {
                file.transferTo(new File(Paths.get(uploadDir, storeFileName).toString()));
                post.addImage(MarketPostImage.builder()
                        .imageUrl("/images/" + storeFileName)
                        .orderIndex(i)
                        .build());
            } catch (IOException e) {
                throw new RuntimeException("이미지 저장 실패", e);
            }
        }
    }

    private void deletePostImages(MarketPost post) {
        post.getImages().forEach(img -> {
            File file = new File(
                    Paths.get(uploadDir, img.getImageUrl().replace("/images/", "")).toString());
            if (file.exists()) {
                file.delete();
            }
        });
        post.getImages().clear();
    }

    private String extractExt(String filename) {
        int pos = filename.lastIndexOf(".");
        return pos == -1 ? "" : filename.substring(pos + 1).toLowerCase();
    }

    private void validateExtension(String ext) {
        if (!Arrays.asList("jpg", "jpeg", "png", "webp").contains(ext)) {
            throw new RuntimeException("허용되지 않는 파일 형식: " + ext);
        }
    }
}