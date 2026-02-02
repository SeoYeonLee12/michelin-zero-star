package com.michelin0.michelinzerostar.domain.aichatmessage.domain;

import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.AiChatMessageErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

//TODO 내가 검증하고 싶은 내용 의도대로 변경하기
@Component
@RequiredArgsConstructor
public class UserMessageSave {

    private final AiChatMessageRepository aiChatMessageRepository;
    private final UserRepository userRepository;

    // DB 저장 작업 => 얘는 동기
    public void saveUserMessage(AiChatMessage message) {
        if (aiChatMessageRepository.existsByUserAndRecipeAndContent(
                message.getUser(),
                message.getRecipe(),
                message.getContent())
        ) {
            throw new GlobalException(AiChatMessageErrorCode.ALREADY_ENROLLED_MESSAGE);
        }
        aiChatMessageRepository.save(message);
    }
}
