package com.michelin0.michelinzerostar.domain.recipe.application;


import com.michelin0.michelinzerostar.domain.recipe.application.command.CookModeCommand;
import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeDetailCommand;
import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeRegisterCommand;
import com.michelin0.michelinzerostar.domain.recipe.application.command.RecipeUpdateCommand;
import com.michelin0.michelinzerostar.domain.recipe.domain.Recipe;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeIngredient;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeQueryRepository;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRegister;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeRepository;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeStep;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeTag;
import com.michelin0.michelinzerostar.domain.recipe.domain.RecipeUpdate;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.CookModeProjection;
import com.michelin0.michelinzerostar.domain.recipe.domain.projection.RecipeDetailProjection;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.repository.UserRepository;
import com.michelin0.michelinzerostar.global.exception.errorcode.RecipeErrorCode;
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
    private final RecipeQueryRepository recipeQueryRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeUpdate recipeUpdate;

    public Long saveRecipe(RecipeRegisterCommand command) {
        User user = userRepository.getById(command.userId());
        Recipe recipe = command.toRecipe(user);
        List<RecipeStep> steps = command.toSteps();
        List<RecipeIngredient> ingredients = command.toIngredients();
        List<RecipeTag> tags = command.toTags();
        List<Long> categoryIds = command.categoryIds();
        return recipeRegister.registerRecipe(recipe, steps, tags, ingredients, categoryIds);
    }

    @Transactional(readOnly = true)
    public RecipeDetailCommand getDetailRecipe(Long recipeId, Long userId) {
        RecipeDetailProjection projection = recipeQueryRepository.findRecipeById(recipeId, userId)
                .orElseThrow(() -> new GlobalException(RecipeErrorCode.RECIPE_NOT_FOUND));
        return RecipeDetailCommand.from(projection);
    }

    public Long updateRecipe(RecipeUpdateCommand command) {
        User user = userRepository.getById(command.userId());
        Recipe recipe = command.toRecipe(user);
        List<RecipeIngredient> ingredient = command.toIngredients();
        List<RecipeStep> steps = command.toSteps();
        List<RecipeTag> tags = command.toTags();
        List<Long> categoryIds = command.categoryIds();
        recipeUpdate.updateRecipe(command.recipeId(), recipe, ingredient, steps, tags, categoryIds);
        return command.recipeId();
    }


    public void deleteRecipe(Long recipeId, Long userId) {
        Recipe searchedRecipe = recipeRepository.getById(recipeId);
        searchedRecipe.validateRecipeEnrolledUser(userId);
        recipeRepository.deleteById(recipeId);
    }

    public CookModeCommand getCookModeDetail(Long recipeId, Long userId) {
        User user = userRepository.getById(userId);
        CookModeProjection projection = recipeQueryRepository.findRecipeStepByRecipeId(recipeId)
                .orElseThrow(() -> new GlobalException(RecipeErrorCode.RECIPE_NOT_FOUND));
        return CookModeCommand.from(projection);
    }
}
