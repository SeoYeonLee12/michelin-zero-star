package com.michelin0.michelinzerostar.domain.aichatmessage.application;

import com.michelin0.michelinzerostar.domain.aichatmessage.application.command.RecipeChatbotCommand;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiChatMessage;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.RecipeAiService;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.UserMessageSave;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

// 동기 비동기 조합할 거임
@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatMessageService {

    private final UserMessageSave userMessageSave;
    private final RecipeAiService recipeAiService;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;

    public void askRecipe(RecipeChatbotCommand command) {
        User searchedUser = userRepository.getReferenceById(command.userId());
        Recipe searchedRecipe = recipeRepository.getReferenceById(command.recipeId());
        log.info("user request -> userId: {}, recipeId: {}, userQuery: {}", command.userId(),
                command.recipeId(), command.userQuery());
        AiChatMessage message = AiChatMessage.createUserMessage(searchedUser, searchedRecipe,
                command.userQuery());
        userMessageSave.saveUserMessage(message);
        recipeAiService.processAI(searchedUser, searchedRecipe, command.userQuery(),
                command.currentStepNumber());
    }
}
