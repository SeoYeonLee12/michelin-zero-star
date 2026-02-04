package com.michelin0.michelinzerostar.domain.aichatmessage.Infrastructure.dto;

import java.util.List;

public record RecommendedRecipeResponse(
        Long recipes_id,
        String title,
        String main_image_url,
        Integer cook_time,
        Double calories,
        List<String> tags
) {

}
