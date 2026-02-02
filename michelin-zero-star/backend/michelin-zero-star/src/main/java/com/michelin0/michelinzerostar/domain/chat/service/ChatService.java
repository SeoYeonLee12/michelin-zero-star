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

    @Value("${file.upload-dir}")
    private String uploadDir;

    // 방 생성 (구매자 입장)
    public Long createOrGetChatRoom(Long postId, Long buyerId) {
        ChatRoom chatRoom = chatRoomRepository.findByPostIdAndBuyerId(postId, buyerId)
                .orElseGet(() -> createChatRoom(postId, buyerId));

        // 구매자가 나간 상태라면 복귀 (초대)
        if (chatRoom.isBuyerLeft()) {
            chatRoom.setBuyerLeft(false);
            chatRoom.setBuyerJoinedAt(LocalDateTime.now());
        }
        return chatRoom.getId();
    }

    private ChatRoom createChatRoom(Long postId, Long buyerId) {
        MarketPost post = marketPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글 없음"));
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        ChatRoom chatRoom = ChatRoom.builder()
                .post(post)
                .seller(post.getWriter())
                .buyer(buyer)
                .build();

        chatRoom.setSellerJoinedAt(LocalDateTime.now());
        chatRoom.setBuyerJoinedAt(LocalDateTime.now());

        return chatRoomRepository.save(chatRoom);
    }

    public void markAsRead(Long roomId, Long userId) {
        chatMessageRepository.bulkUpdateReadStatus(roomId, userId);
    }

    // 메시지 저장 (상대방 자동 소환 로직)
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
                .build();
        ChatMessage savedMessage = chatMessageRepository.save(message);
        chatRoom.updateLastMessage(content);

        return new ChatMessageResponse(savedMessage);
    }

    // 메시지 조회
    public List<ChatMessageResponse> getMessage(Long roomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));

        LocalDateTime myJoinedAt;
        if (chatRoom.getSeller().getId().equals(userId)) {
            myJoinedAt = chatRoom.getSellerJoinedAt() != null ? chatRoom.getSellerJoinedAt()
                    : LocalDateTime.now();
        } else if (chatRoom.getBuyer().getId().equals(userId)) {
            myJoinedAt = chatRoom.getBuyerJoinedAt() != null ? chatRoom.getBuyerJoinedAt()
                    : LocalDateTime.now();
        } else {
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        chatMessageRepository.bulkUpdateReadStatus(roomId, userId);

        return chatMessageRepository.findByChatRoomIdAndCreatedAtAfterOrderByCreatedAt(roomId,
                        myJoinedAt)
                .stream().map(ChatMessageResponse::new).collect(Collectors.toList());
    }

    // 이미지 전송
    public void sendImage(Long roomId, Long senderId, MultipartFile file) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 이미지 보낼 때도 상대방 소환
        checkAndRejoinPartner(chatRoom, senderId);

        if (file.isEmpty()) {
            throw new RuntimeException("파일 없음");
        }

        try {
            File folder = new File(uploadDir);
            if (!folder.exists()) {
                folder.mkdirs();
            }

            String savedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            File destination = new File(uploadDir + File.separator + savedFileName);
            file.transferTo(destination);

            String imageUrl = "/images/" + savedFileName;
            ChatMessage message = ChatMessage.builder()
                    .chatRoom(chatRoom)
                    .sender(sender)
                    .message("사진을 보냈습니다.")
                    .imageUrl(imageUrl)
                    .build();

            chatMessageRepository.save(message);
            chatRoom.updateLastMessage("사진을 보냈습니다.");
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패");
        }
    }

    // 채팅방 목록 조회
    @Transactional(readOnly = true)
    public List<ChatRoomListResponse> getChatRoomList(Long userId) {
        List<ChatRoom> chatRooms = chatRoomRepository.findMyChatRooms(userId);

        return chatRooms.stream().map(chatRoom -> {
            User partner;
            LocalDateTime myJoinedAt;

            if (chatRoom.getSeller().getId().equals(userId)) {
                partner = chatRoom.getBuyer();
                myJoinedAt = chatRoom.getSellerJoinedAt() != null ? chatRoom.getSellerJoinedAt()
                        : LocalDateTime.now();
            } else {
                partner = chatRoom.getSeller();
                myJoinedAt = chatRoom.getBuyerJoinedAt() != null ? chatRoom.getBuyerJoinedAt()
                        : LocalDateTime.now();
            }

            int unreadCount = chatMessageRepository.countUnreadMessages(chatRoom.getId(), userId,
                    myJoinedAt);
            return new ChatRoomListResponse(chatRoom, partner, unreadCount);
        }).collect(Collectors.toList());
    }

    // 방 나가기 (상태만 변경)
    public void leaveChatRoom(Long roomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방 없음"));

        if (chatRoom.getSeller().getId().equals(userId)) {
            chatRoom.setSellerLeft(true);
        } else if (chatRoom.getBuyer().getId().equals(userId)) {
            chatRoom.setBuyerLeft(true);
        } else {
            throw new RuntimeException("권한 없음");
        }
    }

    // 상대방 복귀 로직
    private void checkAndRejoinPartner(ChatRoom chatRoom, Long senderId) {
        if (chatRoom.getSeller().getId().equals(senderId)) {
            // 내가 판매자 -> 구매자가 나갔으면 복귀
            if (chatRoom.isBuyerLeft()) {
                chatRoom.setBuyerLeft(false);
                chatRoom.setBuyerJoinedAt(LocalDateTime.now());
            }
        } else {
            // 내가 구매자 -> 판매자가 나갔으면 복귀
            if (chatRoom.isSellerLeft()) {
                chatRoom.setSellerLeft(false);
                chatRoom.setSellerJoinedAt(LocalDateTime.now());
            }
        }
    }
}