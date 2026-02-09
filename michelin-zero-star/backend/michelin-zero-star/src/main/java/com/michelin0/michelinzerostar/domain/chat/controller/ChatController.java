package com.michelin0.michelinzerostar.domain.chat.controller;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatMessageRequest;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatMessageResponse;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatReadResponse;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatRoomCreateRequest;
import com.michelin0.michelinzerostar.domain.chat.dto.ChatRoomListResponse;
import com.michelin0.michelinzerostar.domain.chat.service.ChatService;
import com.michelin0.michelinzerostar.global.security.jwt.JwtTokenProvider;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * [WebSocket] 메시지 전송
     *
     * @AuthenticationPrincipal 대신 @Header를 통해 토큰을 받아 직접 유저를 식별
     */
    @MessageMapping("/chat/message")
    public void sendMessage(ChatMessageRequest request, @Header("Authorization") String token) {
        String resolvedToken = extractToken(token);
        UserPrincipal user = getUserFromToken(resolvedToken);

        log.info("[WebSocket] 메시지 수신 - 유저ID: {}, 내용: {}", user.getId(), request.getContent());

        ChatMessageResponse response = chatService.saveMessage(request.getRoomId(), user.getId(),
                request.getContent());

        messagingTemplate.convertAndSend("/sub/chat/room/" + request.getRoomId(), response);
        messagingTemplate.convertAndSend("/sub/chat/user/" + response.getRecipientId(), response);
    }

    /**
     * [WebSocket] 실시간 읽음 처리 요청
     */
    @MessageMapping("/chat/read")
    public void readMessage(ChatMessageRequest request, @Header("Authorization") String token) {
        String resolvedToken = extractToken(token);
        UserPrincipal user = getUserFromToken(resolvedToken);

        log.info("[WebSocket] 읽음 처리 요청 - 유저ID: {}, 방ID: {}", user.getId(), request.getRoomId());

        chatService.markAsRead(request.getRoomId(), user.getId());

        // [Modified] 누가 읽었는지 정보 포함하여 전송
        ChatReadResponse readResponse = new ChatReadResponse(request.getRoomId(), user.getId());
        messagingTemplate.convertAndSend("/sub/chat/room/" + request.getRoomId() + "/read", readResponse);
    }

    @GetMapping("/api/v1/chat/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long roomId) {

        log.info("[API] 메시지 목록 조회 - 유저ID: {}, 방ID: {}", user.getId(), roomId);

        // 서비스 내부에서 markAsRead와 시간 필터링 조회를 한 번에 수행
        return ResponseEntity.ok(chatService.getMessage(roomId, user.getId()));
    }

    @PostMapping("/api/v1/chat/rooms")
    public ResponseEntity<Long> createRoom(@AuthenticationPrincipal UserPrincipal user,
            @RequestBody ChatRoomCreateRequest request) {
        return ResponseEntity.ok(
                chatService.createOrGetChatRoom(request.getPostId(), user.getId()));
    }

    @GetMapping("/api/v1/chat/rooms")
    public ResponseEntity<List<ChatRoomListResponse>> getRoomList(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(chatService.getChatRoomList(user.getId()));
    }

    @PostMapping("/api/v1/chat/rooms/{roomId}/images")
    public ResponseEntity<String> sendImage(@AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId, @RequestParam("file") MultipartFile file) {
        chatService.sendImage(roomId, user.getId(), file);
        return ResponseEntity.ok("전송 완료");
    }

    @DeleteMapping("/api/v1/chat/rooms/{roomId}")
    public ResponseEntity<String> leaveRoom(@AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long roomId) {
        chatService.leaveChatRoom(roomId, user.getId());
        return ResponseEntity.ok("방에서 나갔습니다.");
    }

    // --- Helper Methods ---

    private String extractToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return token;
    }

    private UserPrincipal getUserFromToken(String token) {
        try {
            Authentication authentication = jwtTokenProvider.getAuthentication(token);
            return (UserPrincipal) authentication.getPrincipal();
        } catch (Exception e) {
            log.error("토큰 인증 실패: {}", e.getMessage());
            throw new RuntimeException("인증 정보가 유효하지 않습니다.");
        }
    }
}