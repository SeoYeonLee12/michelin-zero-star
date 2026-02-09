package com.michelin0.michelinzerostar.domain.chat.repository;

import com.michelin0.michelinzerostar.domain.chat.entity.ChatMessage;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // [시간 필터링] 내 입장 시간(joinedAt)보다 '같거나 이후'에 생성된 메시지만 조회
    List<ChatMessage> findByChatRoomIdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(Long chatRoomId, LocalDateTime joinedAt);

    // [안 읽은 메시지 개수] 내 입장 시간 이후의 메시지 중에서만 카운트
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead = false AND m.createdAt >= :joinedAt")
    int countUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId, @Param("joinedAt") LocalDateTime joinedAt);

    // [읽음 처리 - Bulk Update]
    @Modifying(clearAutomatically = true)
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead = false")
    void bulkUpdateReadStatus(@Param("roomId") Long roomId, @Param("userId") Long userId);

    // ★ [추가됨] 방 완전 삭제 시 해당 방의 메시지 전체 삭제 (ChatService에서 호출)
    void deleteAllByChatRoomId(Long chatRoomId);
}