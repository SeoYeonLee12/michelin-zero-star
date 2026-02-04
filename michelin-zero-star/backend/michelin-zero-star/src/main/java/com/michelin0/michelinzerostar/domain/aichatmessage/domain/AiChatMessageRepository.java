package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {

    boolean existsByUserIdAndContent(Long userId, String content);

    boolean existsByUserAndRecipeAndContent(User user, Recipe recipe, String content);
}
