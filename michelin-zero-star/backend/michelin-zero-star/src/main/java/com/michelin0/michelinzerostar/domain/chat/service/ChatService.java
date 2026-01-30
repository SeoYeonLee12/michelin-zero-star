package com.michelin0.michelinzerostar.domain.chat.service;

import com.michelin0.michelinzerostar.domain.chat.dto.ChatMessageResponse;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatRoomListResponse;
import com.michelin0.michelinzerostar.domain.chat.entity.ChatMessage;
import com.michelin0.michelinzerostar.domain.chat.entity.ChatRoom;
import com.michelin0.michelinzerostar.domain.chat.repository.ChatMessageRepository;
import com.michelin0.michelinzerostar.domain.chat.repository.ChatRoomRepository;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.market.repository.MarketPostRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MarketPostRepository marketPostRepository;
    private final UserRepository userRepository;

    public Long createOrGetChatRoom(Long postId, Long buyerId) {
        return chatRoomRepository.findByPostIdAndBuyerId(postId, buyerId).map(ChatRoom::getId)
                .orElseGet(() -> createChatRoom(postId, buyerId));
    }

    private Long createChatRoom(Long postId, Long buyerId) {
        MarketPost post = marketPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 본인 게시글에 채팅 불가 체크
        if (post.getWriter().getId().equals(buyerId)) {
            throw new RuntimeException("본인의 게시글에는 채팅할 수 없습니다.");
        }

        ChatRoom chatRoom = ChatRoom.builder().post(post).seller(post.getWriter()).buyer(buyer)
                .build();

        return chatRoomRepository.save(chatRoom).getId();
    }

    public void saveMessage(Long roomId, Long senderId, String content) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방이 존재하지 않습니다."));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        ChatMessage message = ChatMessage.builder().chatRoom(chatRoom).sender(sender)
                .message(content).build();

        chatMessageRepository.save(message);

        chatRoom.updateLastMessage(content);
    }

    public List<ChatMessageResponse> getMessage(Long roomId, Long userId) {

        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방이 존재하지 않습니다."));
        if (!chatRoom.getSeller().getId().equals(userId) && !chatRoom.getBuyer().getId()
                .equals(userId)) {
            throw new RuntimeException("해당 채팅방에 접근 권한이 없습니다.");
        }
        chatMessageRepository.bulkUpdateReadStatus(roomId, userId);
        List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdOrderByCreatedAt(roomId);
        return messages.stream().map(ChatMessageResponse::new).collect(Collectors.toList());
    }

    @Value("${file.upload-dir}")
    private String uploadDir;

    public void sendImage(Long roomId, Long senderId, MultipartFile file) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방이 없습니다."));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // "image/jpeg", "image/png" 처럼 "image"로 시작하지 않으면 튕겨냄
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image")) {
            throw new RuntimeException("이미지 파일만 업로드할 수 있습니다.");
        }

        // 파일이 비어있는지 확인
        if (file.isEmpty()) {
            throw new RuntimeException("파일이 없습니다.");
        }

        try {
            // 파일 저장 경로 설정 (폴더 없으면 생성)
            File folder = new File(uploadDir);
            if (!folder.exists()) {
                folder.mkdirs();
            }

            // 파일명 중복 방지 (UUID 사용)
            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String savedFileName = UUID.randomUUID().toString() + extension; // 예: asd-123.jpg

            // 실제 파일 저장
            File destination = new File(uploadDir + File.separator + savedFileName);
            file.transferTo(destination);

            // DB에 저장할 접근 URL (예: /images/asd-123.jpg)
            String imageUrl = "/images/" + savedFileName;

            // ChatMessage 저장
            ChatMessage message = ChatMessage.builder()
                    .chatRoom(chatRoom)
                    .sender(sender)
                    .message("사진을 보냈습니다.") // 텍스트는 대체 문구
                    .imageUrl(imageUrl)       // URL 저장
                    .build();

            chatMessageRepository.save(message);
            chatRoom.updateLastMessage("사진을 보냈습니다.");

        } catch (IOException e) {
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다.");
        }
    }


    @Transactional(readOnly = true)
    public List<ChatRoomListResponse> getChatRoomList(Long userId) {
        List<ChatRoom> chatRooms = chatRoomRepository.findMyChatRooms(userId);
        return chatRooms.stream().map(chatRoom -> {
            User partner;
            if (chatRoom.getSeller().getId().equals(userId)) {
                partner = chatRoom.getBuyer(); // 내가 판매자면 -> 상대는 구매자
            } else {
                partner = chatRoom.getSeller(); // 내가 구매자면 -> 상대는 판매자
            }
            // 안 읽은 메시지 개수 가져오기
            int unreadCount = chatMessageRepository.countByChatRoomIdAndSenderIdNotAndIsReadFalse(
                    chatRoom.getId(), userId);
            return new ChatRoomListResponse(chatRoom, partner, unreadCount);
        }).collect(Collectors.toList());
    }
}