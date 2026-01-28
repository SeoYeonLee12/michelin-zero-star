"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/cook-sync/navbar"
import { RecipeDetailView } from "@/components/cook-sync/recipe-detail-view"
import { StepCookMode } from "@/components/cook-sync/step-cook-mode"
import { CompleteCookDialog } from "@/components/cook-sync/complete-cook-dialog"
import { Button } from "@/components/ui/button"
//  실제 API 함수를 가져오기
import { leftoverRecipes } from "@/lib/dummy-data" 
import { getRecipeDetail, BackendRecipeResponse } from "@/lib/api/recipes" 
import { ArrowLeft, Loader2 } from "lucide-react"
import type { Recipe } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { NewRecipeContent } from "@/components/cook-sync/new-recipe-content"

type ViewState = "detail" | "cooking"

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recipeId = params.id as string
  const { userRecipes, user, completedRecipes } = useAuth()

  // [추가] API 연동을 위한 상태 관리
  const [recipe, setRecipe] = React.useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewState, setViewState] = React.useState<ViewState>("detail")
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [showCompleteDialog, setShowCompleteDialog] = React.useState(false)

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
      description: data.description,
      steps: data.steps.map((step) => ({
        id: step.step_number,
        stepNumber: step.step_number,
        action: step.step_description.slice(0, 15) + "...", // 요약 필드가 없을 때 대비
        description: step.step_description,
        ingredients: [], // 필요 시 data.ingredients 매핑 로직 추가 가능
        tools: [],
        duration: step.timer_seconds,
        imageUrl: step.step_imageUrl || "/placeholder.svg",
        tips: step.cooking_tip || undefined,
      })),
    }
  }

  // [수정] useMemo 대신 useEffect를 사용하여 API 데이터를 fetch
  React.useEffect(() => {
    async function loadRecipe() {
      if (recipeId === "new") {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // 실제 API 호출 (authContext에 토큰이 완성되면 두 번째 인자로 전달)
        const data = await getRecipeDetail(recipeId)
        setRecipe(mapBackendToFrontend(data))
      } catch (error) {
        console.error("레시피를 불러오는데 실패했습니다:", error)
        setRecipe(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecipe()
  }, [recipeId])

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

  const handleStartCooking = () => {
    setViewState("cooking")
  }

  const handleCompleteCooking = () => {
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
            <p className="text-muted-foreground">요청하신 레시피가 존재하지 않거나 에러가 발생했습니다.</p>
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
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Recipe Detail View */}
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

          {/* Cooking Mode View */}
          {viewState === "cooking" && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
              className="space-y-6"
            >
              <StepCookMode
                steps={recipe.steps}
                currentStepIndex={currentStepIndex}
                onStepChange={setCurrentStepIndex}
                onComplete={handleCompleteCooking}
                recipeName={recipe.name}
              />
            </motion.div>
          )}
        </div>
      </main>

      <CompleteCookDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        completedRecipe={recipe}
        leftoverRecipes={leftoverRecipes}
        onSelectLeftover={handleSelectLeftover}
      />
    </div>
  )
}