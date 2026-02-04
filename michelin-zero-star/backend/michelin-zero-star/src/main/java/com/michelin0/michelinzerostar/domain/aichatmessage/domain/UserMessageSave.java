package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMessageSave {

    private final AiChatMessageRepository aiChatMessageRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;

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
}
