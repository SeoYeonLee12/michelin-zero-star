package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {

    boolean existsByUserIdAndContent(Long userId, String content);
}
