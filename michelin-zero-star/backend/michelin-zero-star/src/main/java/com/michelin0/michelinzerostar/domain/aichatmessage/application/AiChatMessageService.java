package com.michelin0.michelinzerostar.domain.aichatmessage.application;

import com.michelin0.michelinzerostar.domain.aichatmessage.application.command.RecipeChatbotCommand;
import com.michelin0.michelinzerostar.domain.aichatmessage.application.result.ChatHistoryResult;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiChatMessage;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiChatMessageQueryRepository;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.RecipeAiService;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.UserMessageSave;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.List;
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
    private final AiChatMessageQueryRepository aiChatMessageQueryRepository;

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

    public List<ChatHistoryResult> getChatHistory(
            Long userId, Long recipeId, Long lastId, int pageSize
    ) {
        if (!userRepository.existsById(userId)) {
            throw new GlobalException(UserErrorCode.USER_NOT_FOUND);
        }
        if (!recipeRepository.existsById(recipeId)) {
            throw new GlobalException(RecipeErrorCode.RECIPE_NOT_FOUND);
        }
        List<AiChatMessage> list = aiChatMessageQueryRepository.getChatHistoryByUserAndRecipe(
                userId, recipeId, lastId, pageSize);
        return list.stream()
                .map(ChatHistoryResult::from)
                .toList();
    }

    // TODO 여기부터 완성
    public void askCommonChatAI(CommonChatbotCommand command){
        User searchedUser= userRepository.getReferenceById(command.userId());

    }

}
