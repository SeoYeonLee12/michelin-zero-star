package com.michelin0.michelinzerostar.domain.chat.repository;

import com.michelin0.michelinzerostar.domain.chat.entity.ChatRoom;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByPostIdAndBuyerId(Long postId, Long buyerId);

    @Query("SELECT cr FROM ChatRoom cr WHERE " +
            "(cr.seller.id = :userId AND cr.isSellerLeft = false) OR " +
            "(cr.buyer.id = :userId AND cr.isBuyerLeft = false) " +
            "ORDER BY cr.lastMessageAt DESC")
    List<ChatRoom> findMyChatRooms(@Param("userId") Long userId);
}