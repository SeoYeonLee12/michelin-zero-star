package com.michelin0.michelinzerostar.domain.chat.controller;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatMessageRequest;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatMessageResponse;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatRoomCreateRequest;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatRoomListResponse;
import com.michelin0.michelinzerostar.domain.chat.service.ChatService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // [채팅방 생성]
    // POST /api/v1/chat/rooms
    // Body: { "postId": 1 }
    @PostMapping("/rooms")
    public ResponseEntity<Long> createRoom(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody ChatRoomCreateRequest request) {

        // DTO에서 postId만 꺼내서 서비스로 전달
        Long roomId = chatService.createOrGetChatRoom(request.getPostId(), user.getId());
        return ResponseEntity.ok(roomId);
    }

    // [메시지 전송]
    // POST /api/v1/chat/rooms/{roomId}/messages
    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<String> sendMessage(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId,
            @RequestBody ChatMessageRequest request) {

        chatService.saveMessage(roomId, user.getId(), request.getContent());
        return ResponseEntity.ok("메시지 전송 완료");
    }

    // [메시지 내역 조회]
    // GET /api/v1/chat/rooms/{roomId}/messages
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessage(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId) {
        List<ChatMessageResponse> messages = chatService.getMessage(roomId, user.getId());
        return ResponseEntity.ok(messages);
    }

    // [이미지 전송]
    // POST /api/v1/chat/rooms/{roomId}/images
    @PostMapping("/rooms/{roomId}/images")
    public ResponseEntity<String> sendImage(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId,
            @RequestParam("file") MultipartFile file) {

        chatService.sendImage(roomId, user.getId(), file);
        return ResponseEntity.ok("이미지 전송 완료");
    }

    // [내 채팅방 목록 조회]
    // GET /api/v1/chat/rooms
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomListResponse>> getChatRoomList(
            @AuthenticationPrincipal UserPrincipal user) {
        List<ChatRoomListResponse> chatRooms = chatService.getChatRoomList(user.getId());
        return ResponseEntity.ok(chatRooms);
    }
}