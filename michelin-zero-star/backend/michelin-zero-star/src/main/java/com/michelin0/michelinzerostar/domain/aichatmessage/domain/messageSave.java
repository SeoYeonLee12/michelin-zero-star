package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class messageSave {

    private final AiChatMessageRepository aiChatMessageRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    // DB 저장 작업 => 얘는 동기
    public void saveUserMessage(AiChatMessage message) {
        if (!userRepository.existsById(message.getUser().getId())) {
            throw new GlobalException(UserErrorCode.USER_NOT_FOUND);
        }
        if (!recipeRepository.existsByRecipeId(message.getRecipe().getRecipeId())) {
            throw new GlobalException(RecipeErrorCode.RECIPE_NOT_FOUND);
        }
        aiChatMessageRepository.save(message);
    }

    @Transactional
    public void saveAiMessageAndPublish(User user, Recipe recipe, String answer){
        AiChatMessage aiChatMessage = AiChatMessage.createAIMessage(
                user,
                recipe,
                answer
        );
        aiChatMessageRepository.save(aiChatMessage);

        applicationEventPublisher.publishEvent(new AiResponseArrivedEvent(aiChatMessage));
    }
}
