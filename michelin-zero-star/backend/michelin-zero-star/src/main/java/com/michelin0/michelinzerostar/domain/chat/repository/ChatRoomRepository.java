package com.michelin0.michelinzerostar.domain.chat.repository;

import com.michelin0.michelinzerostar.domain.chat.entity.ChatRoom;
import io.lettuce.core.dynamic.annotation.Param;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByPostIdAndBuyerId(Long postId, Long buyerId);

    @Query("SELECT cr FROM ChatRoom cr WHERE cr.seller.id = :userId OR cr.buyer.id = :userId ORDER BY cr.lastMessageAt DESC")
    List<ChatRoom> findMyChatRooms(@Param("userId") Long userId);
}

