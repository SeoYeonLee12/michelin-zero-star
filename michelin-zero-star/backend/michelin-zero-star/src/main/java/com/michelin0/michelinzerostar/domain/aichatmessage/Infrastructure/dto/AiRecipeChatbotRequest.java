package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.Comparator;
import java.util.List;

public record AiRecipeChatbotRequest(
        Long user_id,
        String query,
        Integer current_step,
        List<RecipeAllStepRequest> recipe_all_steps
) {

    public static AiRecipeChatbotRequest of(User user, String content, Integer currentStep,
            List<RecipeStep> steps) {
        return new AiRecipeChatbotRequest(
                user.getId(),
                content,
                currentStep,
                steps.stream()
                        .sorted(Comparator.comparing(RecipeStep::getStepNumber))
                        .map(RecipeAllStepRequest::from)
                        .toList()
        );
    }
}
