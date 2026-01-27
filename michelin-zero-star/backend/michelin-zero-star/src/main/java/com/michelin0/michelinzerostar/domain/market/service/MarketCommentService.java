package com.michelin0.michelinzerostar.domain.market.service;

import com.michelin0.michelinzerostar.domain.market.dto.request.MarketCommentRequest;
import com.michelin0.michelinzerostar.domain.market.dto.response.MarketCommentResponse;
import com.michelin0.michelinzerostar.domain.market.entity.MarketComment;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.market.repository.MarketCommentRepository;
import com.michelin0.michelinzerostar.domain.market.repository.MarketPostRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.MarketErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MarketCommentService {

    private final MarketCommentRepository commentRepository;
    private final MarketPostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createComment(Long userId, Long postId, MarketCommentRequest request) {
        User writer = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        MarketPost post = postRepository.findById(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

        MarketComment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new GlobalException(MarketErrorCode.COMMENT_NOT_FOUND));

            if (parent.getParent() != null) {
                throw new GlobalException(MarketErrorCode.CANNOT_REPLY_TO_REPLY);
            }
        }

        MarketComment comment = MarketComment.builder()
                .writer(writer)
                .marketPost(post)
                .content(request.getContent())
                .parent(parent)
                .build();

        commentRepository.save(comment);
    }

    public List<MarketCommentResponse> getComments(Long postId) {
        MarketPost post = postRepository.findById(postId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.POST_NOT_FOUND));

        return commentRepository.findByMarketPostAndParentIsNullOrderByCreatedAtAsc(post).stream()
                .map(MarketCommentResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        MarketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new GlobalException(MarketErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getWriter().getId().equals(userId)) {
            throw new GlobalException(MarketErrorCode.NOT_COMMENT_OWNER);
        }

        commentRepository.delete(comment);
    }
}