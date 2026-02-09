package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.AiTransferClient;
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

// ai 작업할 서비스임(얘는 비동기 작업)
// TODO 비동기 처리하는 위치도 이상함.
@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeAiService {

    private final AiChatMessageRepository aiChatMessageRepository;
    private final AiTransferClient aiTransferClient;
    private final RecipeStepRepository recipeStepRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final UserFavoriteCategoryRepository userFavoriteCategoryRepository;
    private final messageSave userMessageSave;

    //TODO: 응답 필요할 시 변경 근데 아직은 모르겠는데 꼭 바꿔야될 거 같기는 함.(Future 타입으로)
    @Async
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
        userMessageSave.saveAiMessageAndPublish(user, recipe, response.answer());
    }

    @Async
    public void processCommonChatbotAI(User user, String content) {
        List<String> userFavoriteCategories =
                userFavoriteCategoryRepository.findCategoryNamesByUser(user);
        // 응답 요청 보내고 응답 받아오기
        CommonAiAnswer answer = aiTransferClient.transferData(
                user,
                content,
                userFavoriteCategories
        );
        // 이벤트 발생하면 리스너가 응답(이 객체가 만들어지는 순간임) -> 유저에게 응답+센더타입+보낸날짜 보내기
        applicationEventPublisher.publishEvent(
                AiChatCompletedEvent.of(user.getId(), answer)
        );
    }
}
