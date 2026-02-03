package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.AiTransferClient;
import com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto.AiRecipeChatbotResponse;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStepRepository;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

// ai 작업할 서비스임(얘는 비동기 작업)
@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeAiService {

    private final AiChatMessageRepository aiChatMessageRepository;
    private final AiTransferClient aiTransferClient;
    private final RecipeStepRepository recipeStepRepository;

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
        // 답변 받기
        AiChatMessage aiChatMessage = AiChatMessage.createAIMessage(
                user,
                recipe,
                response.answer()
        );
        aiChatMessageRepository.save(aiChatMessage);
        
        // TODO 소켓으로 답변 전달
        /**
         * 2. 소켓 전송 로직 분리 방법 (결합도 낮추기)
         * 지금처럼 서비스에서 SimpMessagingTemplate을 직접 쓰는 대신,
         * "Spring Event (이벤트 발행)" 방식을 사용하면 완벽하게 분리할 수 있습니다.
         *
         * 방법:
         * RecipeAiService는 소켓 템플릿 대신 ApplicationEventPublisher 라는 것을 주입받습니다.
         *
         * AI 응답 처리가 끝나면 직접 소켓을 쏘는 게 아니라, "이벤트 하나 발행할게!
         * (예: AiResponseArrivedEvent)" 라고 소리만 치고 끝냅니다.
         *
         * **별도의 리스너 클래스(예: WebSocketEventListener)**를 만들어서 그 이벤트를 기다리게 합니다.
         *
         * 이벤트가 발생하면 리스너가 깨어나서 그때 SimpMessagingTemplate을 사용해 클라이언트에게 메시지를 보냅니다.
         *
         * 이렇게 하면 **AI 로직(Service)**과 **알림 전송 로직(Socket)**이 서로 남남이 되어,
         * 나중에 소켓 대신 다른 알림(FCM, 메일 등)으로 바뀌어도 AI 서비스 코드는 건드릴 필요가 없어집니다.
         */
    }

}
