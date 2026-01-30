package com.michelin0.michelinzerostar.domain.chat.dto;

import com.michelin0.michelinzerostar.domain.chat.entity.ChatRoom;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.time.LocalDateTime;
import lombok.Getter;


@Getter
public class ChatRoomListResponse {

    private Long chatRoomId;
    private Long otherUserId;
    private String otherUserNickname;
    private String otherUserProfileImage;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private int unreadCount;
    private String postTitle;
    private String postThumbnail;  // 게시글 썸네일

    public ChatRoomListResponse(ChatRoom chatRoom, User otherUser, int unreadCount) {
        this.chatRoomId = chatRoom.getId();
        this.otherUserId = otherUser.getId();
        this.otherUserNickname = otherUser.getNickname();
        this.otherUserProfileImage = otherUser.getProfileImageUrl();
        this.lastMessage = chatRoom.getLastMessage();
        this.lastMessageAt = chatRoom.getLastMessageAt();
        this.unreadCount = unreadCount;
        this.postTitle = chatRoom.getPost().getTitle();

        if (!chatRoom.getPost().getImages().isEmpty()) {
            this.postThumbnail = chatRoom.getPost().getImages().get(0).getImageUrl();
        }
    }
}
