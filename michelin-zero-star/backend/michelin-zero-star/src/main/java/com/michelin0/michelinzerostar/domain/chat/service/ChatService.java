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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MarketPostRepository marketPostRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // 1. 방 생성 또는 입장
    public Long createOrGetChatRoom(Long postId, Long buyerId) {
        ChatRoom chatRoom = chatRoomRepository.findByPostIdAndBuyerId(postId, buyerId)
                .orElseGet(() -> createChatRoom(postId, buyerId));

        if (chatRoom.isBuyerLeft()) {
            chatRoom.setBuyerLeft(false);
            chatRoom.setBuyerJoinedAt(LocalDateTime.now().minusSeconds(1));
        }
        return chatRoom.getId();
    }

    private ChatRoom createChatRoom(Long postId, Long buyerId) {
        MarketPost post = marketPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글 없음"));
        post.increaseChatCount();

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now().minusSeconds(1);

        ChatRoom chatRoom = ChatRoom.builder()
                .post(post)
                .seller(post.getWriter())
                .buyer(buyer)
                .build();

        chatRoom.setSellerJoinedAt(now);
        chatRoom.setBuyerJoinedAt(now);

        return chatRoomRepository.save(chatRoom);
    }

    // 2. 메시지 저장
    public ChatMessageResponse saveMessage(Long roomId, Long senderId, String content) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        checkAndRejoinPartner(chatRoom, senderId);

        ChatMessage message = ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .message(content)
                .isRead(false) // [확인] Entity 생성자 빌더 파라미터명과 일치
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        chatRoom.updateLastMessage(content);

        return new ChatMessageResponse(savedMessage);
    }

    // 3. 메시지 조회 (읽음 처리 + 시간 필터링)
    public List<ChatMessageResponse> getMessage(Long roomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));

        // [읽음 처리]
        markAsRead(roomId, userId);

        LocalDateTime myJoinedAt;

        if (chatRoom.getSeller().getId().equals(userId)) {
            myJoinedAt = chatRoom.getSellerJoinedAt();
        } else if (chatRoom.getBuyer().getId().equals(userId)) {
            myJoinedAt = chatRoom.getBuyerJoinedAt();
        } else {
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        if (myJoinedAt == null) {
            myJoinedAt = LocalDateTime.of(2000, 1, 1, 0, 0, 0);
        }

        return chatMessageRepository.findByChatRoomIdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(roomId, myJoinedAt)
                .stream()
                .map(ChatMessageResponse::new)
                .collect(Collectors.toList());
    }

    // [읽음 처리 - Bulk Update]
    public void markAsRead(Long roomId, Long userId) {
        chatMessageRepository.bulkUpdateReadStatus(roomId, userId);
    }

    // 이미지 전송
    public void sendImage(Long roomId, Long senderId, MultipartFile file) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        checkAndRejoinPartner(chatRoom, senderId);

        if (file.isEmpty()) throw new RuntimeException("파일 없음");

        try {
            File folder = new File(uploadDir);
            if (!folder.exists()) folder.mkdirs();

            String savedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            File destination = new File(uploadDir + File.separator + savedFileName);
            file.transferTo(destination);

            String imageUrl = "/images/" + savedFileName;
            ChatMessage message = ChatMessage.builder()
                    .chatRoom(chatRoom)
                    .sender(sender)
                    .message("사진을 보냈습니다.")
                    .imageUrl(imageUrl)
                    .isRead(false) // [확인]
                    .build();

            chatMessageRepository.save(message);
            chatRoom.updateLastMessage("사진을 보냈습니다.");
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패");
        }
    }

    // 목록 조회
    @Transactional(readOnly = true)
    public List<ChatRoomListResponse> getChatRoomList(Long userId) {
        List<ChatRoom> chatRooms = chatRoomRepository.findMyChatRooms(userId);

        return chatRooms.stream().map(chatRoom -> {
            User partner;
            LocalDateTime myJoinedAt;

            if (chatRoom.getSeller().getId().equals(userId)) {
                partner = chatRoom.getBuyer();
                myJoinedAt = chatRoom.getSellerJoinedAt();
            } else {
                partner = chatRoom.getSeller();
                myJoinedAt = chatRoom.getBuyerJoinedAt();
            }

            if (myJoinedAt == null) myJoinedAt = LocalDateTime.now();

            int unreadCount = chatMessageRepository.countUnreadMessages(chatRoom.getId(), userId, myJoinedAt);
            return new ChatRoomListResponse(chatRoom, partner, unreadCount);
        }).collect(Collectors.toList());
    }

    // 4. 방 나가기 (Soft Delete)
    public void leaveChatRoom(Long roomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));

        if (chatRoom.getSeller().getId().equals(userId)) {
            chatRoom.setSellerLeft(true);
        } else if (chatRoom.getBuyer().getId().equals(userId)) {
            chatRoom.setBuyerLeft(true);
        } else {
            throw new RuntimeException("방 참여자가 아닙니다.");
        }

        if (chatRoom.isSellerLeft() && chatRoom.isBuyerLeft()) {
            chatMessageRepository.deleteAllByChatRoomId(roomId);
            chatRoomRepository.delete(chatRoom);
        }
    }

    // 5. 파트너 재초대
    private void checkAndRejoinPartner(ChatRoom chatRoom, Long senderId) {
        if (chatRoom.getSeller().getId().equals(senderId)) {
            if (chatRoom.isBuyerLeft()) {
                chatRoom.setBuyerLeft(false);
                chatRoom.setBuyerJoinedAt(LocalDateTime.now().minusSeconds(1));
            }
        } else {
            if (chatRoom.isSellerLeft()) {
                chatRoom.setSellerLeft(false);
                chatRoom.setSellerJoinedAt(LocalDateTime.now().minusSeconds(1));
            }
        }
    }
}