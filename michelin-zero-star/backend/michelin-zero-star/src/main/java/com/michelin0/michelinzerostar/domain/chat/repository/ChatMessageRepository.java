package com.michelin0.michelinzerostar.domain.chat.repository;

import com.michelin0.michelinzerostar.domain.chat.entity.ChatMessage;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 내가 나갔다가 다시 들어오면 joinedAt이 갱신되어 이전 메시지는 안 보임
    List<ChatMessage> findByChatRoomIdAndCreatedAtAfterOrderByCreatedAt(Long chatRoomId,
            LocalDateTime joinedAt);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead = false")
    void bulkUpdateReadStatus(@Param("roomId") Long roomId, @Param("userId") Long userId);

    // 안 읽은 개수 셀 때도 내 입장 시간 이후 것만 세야 함
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead = false AND m.createdAt > :joinedAt")
    int countUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId,
            @Param("joinedAt") LocalDateTime joinedAt);
}