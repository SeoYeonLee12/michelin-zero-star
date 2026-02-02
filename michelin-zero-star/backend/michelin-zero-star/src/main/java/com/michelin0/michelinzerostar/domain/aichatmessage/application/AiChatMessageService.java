package com.michelin0.michelinzerostar.domain.aichatmessage.application;

import com.michelin0.michelinzerostar.domain.aichatmessage.domain.AiChatMessageRepository;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.RecipeAiService;
import com.michelin0.michelinzerostar.domain.aichatmessage.domain.UserMessageSave;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// 동기 비동기 조합할 거임
@Service
@RequiredArgsConstructor
public class AiChatMessageService {

    private final AiChatMessageRepository aiChatMessageRepository;
    private final UserMessageSave userMessageSave;
    private final RecipeAiService recipeAiService;

    /**
     * 컨트롤러 수신
     * <p>
     * [동기] DB에 User Message 저장 (빠름, 0.01초) -> 데이터 유실 방지
     * <p>
     * [비동기 @Async] AI 서버로 요청 날리기 (느림, 3~10초) -> DB 저장 후 즉시 실행
     * <p>
     * 클라이언트에게는 "전송됨" 응답 (이미 끝남)
     * <p>
     * 나중에 AI 응답 오면 -> DB에 AI Message 저장 & 소켓 발송
     */


}
