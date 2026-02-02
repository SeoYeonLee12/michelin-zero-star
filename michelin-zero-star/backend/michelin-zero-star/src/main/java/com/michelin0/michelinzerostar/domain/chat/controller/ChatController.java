package com.michelin0.michelinzerostar.domain.chat.controller;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatMessageRequest;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatMessageResponse;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatRoomCreateRequest;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatRoomListResponse;
import com.michelin0.michelinzerostar.domain.chat.service.ChatService;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    // 메시지 전송 (Socket)
    @MessageMapping("/chat/message")
    public void sendMessage(ChatMessageRequest request, @Header("Authorization") String token) {
        String resolvedToken = token.substring(7);
        Authentication authentication = jwtTokenProvider.getAuthentication(resolvedToken);
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();

        ChatMessageResponse response = chatService.saveMessage(request.getRoomId(), user.getId(),
                request.getContent());

        // 구독자들에게 메시지 발송http://localhost:8080/api/v1/chat/rooms/3/messages
        messagingTemplate.convertAndSend("/sub/chat/room/" + request.getRoomId(), response);
    }

    // 채팅방 생성 또는 입장
    @PostMapping("/api/v1/chat/rooms")
    public ResponseEntity<Long> createRoom(@AuthenticationPrincipal UserPrincipal user,
            @RequestBody ChatRoomCreateRequest request) {
        return ResponseEntity.ok(
                chatService.createOrGetChatRoom(request.getPostId(), user.getId()));
    }

    // 채팅방 메시지 조회 (입장 시 호출)
    @GetMapping("/api/v1/chat/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getMessage(roomId, user.getId()));
    }

    // 내 채팅방 목록 조회
    @GetMapping("/api/v1/chat/rooms")
    public ResponseEntity<List<ChatRoomListResponse>> getRoomList(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(chatService.getChatRoomList(user.getId()));
    }

    // 이미지 전송
    @PostMapping("/api/v1/chat/rooms/{roomId}/images")
    public ResponseEntity<String> sendImage(@AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId, @RequestParam("file") MultipartFile file) {
        chatService.sendImage(roomId, user.getId(), file);
        return ResponseEntity.ok("전송 완료");
    }

    @PutMapping("/api/v1/chat/rooms/{roomId}/read")
    public ResponseEntity<String> markAsRead(@AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId) {
        chatService.markAsRead(roomId, user.getId());
        return ResponseEntity.ok("읽음 처리 완료");
    }

    // 방 나가기 (삭제)
    @DeleteMapping("/api/v1/chat/rooms/{roomId}")
    public ResponseEntity<String> leaveRoom(@AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId) {
        chatService.leaveChatRoom(roomId, user.getId());
        return ResponseEntity.ok("방이 삭제되었습니다.");
    }
}