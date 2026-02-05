"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/cook-sync/navbar"
import { RecipeDetailView } from "@/components/cook-sync/recipe-detail-view"
import { StepCookMode } from "@/components/cook-sync/step-cook-mode"
import { CompleteCookDialog } from "@/components/cook-sync/complete-cook-dialog"
import { Button } from "@/components/ui/button"
import { getRecipeDetail, BackendRecipeResponse, getCookingModeDetails, CookingModeResponse, completeCooking, getRecipeList, RecipeListItem } from "@/lib/api/recipes"
import { ArrowLeft, Loader2 } from "lucide-react"
import type { Recipe } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { NewRecipeContent } from "@/components/cook-sync/new-recipe-content"
import { getCookie } from "@/lib/cookie"
import { cn } from "@/lib/utils"

type ViewState = "detail" | "cooking"

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recipeId = params.id as string
  const { userRecipes, user, completedRecipes, isLoading: isAuthLoading } = useAuth()

  // [추가] API 연동을 위한 상태 관리
  const [recipe, setRecipe] = React.useState<Recipe | null>(null)
  const [cookingData, setCookingData] = React.useState<CookingModeResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCookingLoading, setIsCookingLoading] = React.useState(false)
  const [viewState, setViewState] = React.useState<ViewState>("detail")
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [showCompleteDialog, setShowCompleteDialog] = React.useState(false)
  const [isAwarded, setIsAwarded] = React.useState(false) // ✅ Added state
  const [recommendedRecipes, setRecommendedRecipes] = React.useState<Recipe[]>([])

  // Fetch random chef recipes for recommendations
  React.useEffect(() => {
    async function loadRecommendations() {
      try {
        const response = await getRecipeList({
          recipeType: "CHEF",
          sort: "RATING",
          size: 20
        })

        // Shuffle and pick 3
        const shuffled = [...response.recipes].sort(() => 0.5 - Math.random())
        const selected = shuffled.slice(0, 3).map(item => ({
          id: item.recipeId.toString(),
          name: item.title,
          thumbnail: item.mainImageUrl,
          averageRating: item.averageRating,
          isLiked: item.isScrapped,
          hashtags: [item.nickName],
          tags: item.tags?.map(t => t.tag_name) || [],
          duration: 30, // Default placeholder
          difficulty: "중급",
          servings: 2,
          steps: []
        }))

        setRecommendedRecipes(selected)
      } catch (error) {
        console.error("Failed to load recommendations:", error)
        setRecommendedRecipes([])
      }
    }

    loadRecommendations()
  }, [])

  // ✅ 화면 상단으로 스크롤 리셋 (상세 <-> 요리모드 전환 시)
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [viewState])

  // [추가] 백엔드 데이터를 기존 프론트엔드 Recipe 타입으로 변환하는 매퍼 함수
  const mapBackendToFrontend = (data: BackendRecipeResponse): Recipe => {
    return {
      id: data.recipeId.toString(),
      name: data.title,
      thumbnail: data.mainImageUrl,
      tags: data.categoryNames,
      hashtags: data.tags.map((t) => t.tag_name),
      duration: data.cookTime,
      difficulty: "중급", // 백엔드 명세에 없는 경우 기본값
      servings: data.servings,
      calories: data.calorie || 0,
      nutrition: {
        carbohydrate: data.carbohydrate,
        protein: data.protein,
        fat: data.saturatedFat,
        sodium: data.sodium,
        cholesterol: data.cholesterol,
        calcium: data.calcium,
      },
      description: data.description,
      ingredients: data.ingredients.map(i => ({
        name: i.ingredient_name,
        amount: i.ingredient_amount
      })),
      steps: data.steps.map((step) => ({
        id: step.step_number,
        stepNumber: step.step_number,
        action: `Step ${step.step_number}`,
        description: step.step_description,
        ingredients: [],
        tools: [],
        duration: step.timer_seconds,
        imageUrl: step.step_imageUrl || "/placeholder.svg",
        tips: step.cooking_tip || undefined,
      })),
      isLiked: data.isScrapped,
      isMine: data.isMine,
      createdAt: data.createdAt,
    }
  }

  // [수정] useMemo 대신 useEffect를 사용하여 API 데이터를 fetch
  React.useEffect(() => {
    async function loadRecipe() {
      if (!recipeId || recipeId === "new") {
        setIsLoading(false)
        return
      }

      // ✅ 인증 초기화가 완료될 때까지 대기
      if (isAuthLoading) {
        return
      }

      try {
        setIsLoading(true)
        const data = await getRecipeDetail(recipeId)
        console.log("Loaded Recipe Data:", data) // [Debug] Check image URLs
        setRecipe(mapBackendToFrontend(data))
      } catch (error) {
        console.error("레시피를 불러오는데 실패했습니다:", error)
        setRecipe(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecipe()
  }, [recipeId, isAuthLoading])

  if (recipeId === "new") {
    return <NewRecipeContent />
  }

  // [추가] 로딩 화면 처리
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#800020]" />
        <p className="mt-4 text-muted-foreground">레시피를 가져오는 중입니다...</p>
      </div>
    )
  }

  const handleStartCooking = async () => {
    try {
      setIsCookingLoading(true)
      const data = await getCookingModeDetails(recipeId)
      console.log("🔍 Cooking Data:", data)
      console.log("🔍 Steps:", data.steps)
      setCookingData(data)
      setViewState("cooking")
    } catch (error) {
      console.error("Failed to start cooking mode:", error)
      alert("요리 모드 시작에 실패했습니다.")
    } finally {
      setIsCookingLoading(false)
    }
  }

  const handleCompleteCooking = async () => {
    try {
      const response = await completeCooking(recipeId)
      console.log("Cooking completed:", response)
      console.log("Cooking completed:", response)
      if (response.isAwardedCookingCompleteReward) {
        // alert("요리 완료 보상을 획득했습니다!") // Remove alert, dialog handles it
        setIsAwarded(true) // ✅ Correctly set state
      } else {
        setIsAwarded(false)
      }
    } catch (error) {
      console.error("Failed to complete cooking:", error)
      // 계속 진행 (Dialog 표시), but maybe handle error state? 
      // For now, assume failure means no reward if network error, but we want to show dialog.
      setIsAwarded(false)
    }
    setShowCompleteDialog(true)
  }


  const handleBack = () => {
    if (viewState === "cooking") {
      setViewState("detail")
    } else {
      router.back()
    }
  }

  const handleSelectLeftover = (selectedRecipe: Recipe) => {
    router.push(`/recipes/${selectedRecipe.id}`)
  }

  if (!recipe) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">레시피를 찾을 수 없습니다</h1>
            <p className="text-muted-foreground">요청하신 레시피가 존재하지 않습니다.</p>
            <Button onClick={() => router.push("/recipes")} className="bg-[#800020] hover:bg-[#800020]/90">
              레시피 목록으로
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className={cn(
          "container mx-auto max-w-6xl px-4 transition-all duration-300",
          viewState === "cooking" ? "py-2" : "py-8"
        )}>
          {/* View State: Detail */}
          {viewState === "detail" && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            >
              <RecipeDetailView
                recipe={recipe}
                onStartCooking={handleStartCooking}
                hasCompletedCooking={completedRecipes.has(recipe.id)}
              />
            </motion.div>
          )}

          {/* View State: Loading Cooking Data */}
          {isCookingLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#800020]" />
              <p className="mt-4 text-muted-foreground">요리 모드 데이터를 준비 중입니다...</p>
            </div>
          )}

          {/* View State: Cooking Mode */}
          {viewState === "cooking" && !isCookingLoading && cookingData && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
              className="space-y-6"
            >
              <StepCookMode
                recipeId={Number(recipeId)}
                steps={cookingData.steps.map(step => ({
                  id: step.recipeStepId,
                  stepNumber: step.stepNumber,
                  action: `Step ${step.stepNumber}`,
                  description: step.stepDescription,
                  ingredients: [], // API doesn't provide step-specific ingredients
                  tools: [],      // API doesn't provide tools
                  duration: step.timerSeconds || 60, // Fallback to 60 seconds
                  imageUrl: step.stepImageUrl,
                  tips: step.cookingTip || undefined,
                }))}
                currentStepIndex={currentStepIndex}
                onStepChange={setCurrentStepIndex}
                onComplete={handleCompleteCooking}
                recipeName={cookingData.title}
                onBack={handleBack}
              />
            </motion.div>
          )}
        </div>
      </main>

      {/* Complete Dialog */}
      <CompleteCookDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        completedRecipe={recipe}
        leftoverRecipes={recommendedRecipes}
        onSelectLeftover={handleSelectLeftover}
        isAwarded={isAwarded} // ✅ Pass prop
      />
    </div>
  )
}
