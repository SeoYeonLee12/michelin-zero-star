package com.michelin0.michelinzerostar.domain.recipe.application;


import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeRegisterCommand;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeIngredient;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRegister;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeTag;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.UserErrorCode;
import com.michelin0.michelinzerostar.global.exception.exception.GlobalException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRegister recipeRegister;
    private final UserRepository userRepository;


    @Transactional
    public Long saveRecipe(RecipeRegisterCommand command) {
        User user = userRepository.findById(command.userId())
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        Recipe recipe = command.toRecipe(user);
        List<RecipeStep> steps = command.toSteps();
        List<RecipeIngredient> ingredients = command.toIngredients();
        List<RecipeTag> tags = command.toTags();
        List<Long> categoryIds = command.categoryIds();
        return recipeRegister.recipeRegist(recipe, steps, tags, ingredients, categoryIds);
    }

//    public RecipeDetailCommand findRecipeDetail(Long recipeId, Long userId) {
//
//    }
}
