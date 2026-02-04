package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.AiTransferClient;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiCommonChatbotResponse;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiRecipeChatbotResponse;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStepRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserFavoriteCategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// ai 작업할 서비스임(얘는 비동기 작업)
@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeAiService {

    private final AiChatMessageRepository aiChatMessageRepository;
    private final AiTransferClient aiTransferClient;
    private final RecipeStepRepository recipeStepRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final UserFavoriteCategoryRepository userFavoriteCategoryRepository;

    //TODO: 응답 필요할 시 변경 근데 아직은 모르겠는데 꼭 바꿔야될 거 같기는 함.(Future 타입으로)
    @Async
    @Transactional
    public void processAI(
            User user,
            Recipe recipe,
            String userQuery,
            Integer currentStepNumber
    ) {
        List<RecipeStep> steps = recipeStepRepository.findAllByRecipeOrderByStepNumberAsc(recipe);
        // 유저에게 받은 데이터 포함해서 보내기
        AiRecipeChatbotResponse response = aiTransferClient.transferData(
                user,
                userQuery,
                currentStepNumber,
                steps
        );
        log.info("AI Response: {}", response.answer());
        // 답변 받기
        AiChatMessage aiChatMessage = AiChatMessage.createAIMessage(
                user,
                recipe,
                response.answer()
        );
        aiChatMessageRepository.save(aiChatMessage);

        applicationEventPublisher.publishEvent(new AiResponseArrivedEvent(aiChatMessage));
    }

    @Async
    public void processCommonChatBotAI(User user, String content) {
        List<String> userFavoriteCategories =
                userFavoriteCategoryRepository.findCategoryNamesByUser(user);
        AiCommonChatbotResponse response = aiTransferClient.transferData(
                user,
                content,
                userFavoriteCategories
        );
        applicationEventPublisher.publishEvent();
    }

}
