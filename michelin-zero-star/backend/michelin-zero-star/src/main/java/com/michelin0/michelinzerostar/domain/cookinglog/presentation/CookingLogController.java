package com.michelin0.michelinzerostar.domain.cookinglog.presentation;

import com.michelin0.michelinzerostar.domain.auth.UserPrincipal;
import com.michelin0.michelinzerostar.domain.cookinglog.application.CookingLogService;
import com.michelin0.michelinzerostar.domain.cookinglog.application.result.CookingCompleteResult;
import com.michelin0.michelinzerostar.domain.cookinglog.presentation.dto.CookingLogCompleteRequest;
import com.michelin0.michelinzerostar.domain.cookinglog.presentation.dto.CookingLogCompleteResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/cooking")
public class CookingLogController {

    private final CookingLogService cookingLogService;

    @PostMapping("/complete")
    public ResponseEntity<CookingLogCompleteResponse> completeCook(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody @Valid CookingLogCompleteRequest request
    ) {
        Long currentUserId = principal.getId();
        CookingCompleteResult result = cookingLogService.saveCookingLog(currentUserId,
                request.recipeId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CookingLogCompleteResponse.from(result));
    }

}
