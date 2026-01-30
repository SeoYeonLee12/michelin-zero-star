package com.michelin0.michelinzerostar.domain.chat.repository;

import com.michelin0.michelinzerostar.domain.chat.entity.ChatMessage;
import io.lettuce.core.dynamic.annotation.Param;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatRoomIdOrderByCreatedAt(Long roomId);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE ChatMessage cm SET cm.isRead = true WHERE cm.chatRoom.id = :roomId AND cm.sender.id != :userId AND cm.isRead = false")
    void bulkUpdateReadStatus(@Param("roomId") Long roomId, @Param("userId") Long userId);

    int countByChatRoomIdAndSenderIdNotAndIsReadFalse(Long roomId, Long userId);
}