"use client"

import * as React from "react"
import { motion, useAnimate } from "framer-motion"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { ScrollToTop } from "@/components/cook-sync/scroll-to-top"
import { ClaudeChatInput } from "@/components/cook-sync/claude-chat-input"
import { RecipeDetailView } from "@/components/cook-sync/recipe-detail-view"
import { StepCookMode } from "@/components/cook-sync/step-cook-mode"
import { CompleteCookDialog } from "@/components/cook-sync/complete-cook-dialog"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import type { Recipe, ChatMessage } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Clock, Users, Flame } from "lucide-react"
import Image from "next/image"
import { MichelinIcon } from "@/components/common/MichelinIcon"
import { getRecipeDetail, getRecipeList, type BackendRecipeResponse, type RecipeListItem } from "@/lib/api/recipes"

const suggestedPrompts = ["잡채 레시피 알려줘", "매콤한게 땡기는데 먹을만한 거 추천해줘", "매운 오징어 요리 찾아줘", "양파로 만들 수 있는 요리 알려줘"]

type ViewState = "chat" | "recommendations" | "detail" | "cooking"

export default function HomePage() {
  const router = useRouter()
  const { user, isLoggedIn, subscribeToAiChat, unsubscribeFromAiChat, sendAiMessage } = useAuth()
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [viewState, setViewState] = React.useState<ViewState>("chat")
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = React.useState(false)
  const [showLoginDialog, setShowLoginDialog] = React.useState(false)
  const [currentRecipes, setCurrentRecipes] = React.useState<Recipe[]>([])
  const [recommendedRecipes, setRecommendedRecipes] = React.useState<Recipe[]>([])
  const chatContainerRef = React.useRef<HTMLDivElement>(null)

  const [scope, animate] = useAnimate()
  const animationRef = React.useRef<boolean>(true)

  const userCookingProfile = {
    name: isLoggedIn && user ? (user.nickname || user.name) : "셰프",
    level: "초급",
    preferredTime: "30분 이내",
    dietary: "일반식",
    kitchen: "1인 가구",
    location: isLoggedIn && user?.location ? user.location : "위치 미등록",
  }

  // --- WebSocket Subscription ---
  React.useEffect(() => {
    // Subscribe to AI Chat using AuthContext WebSocket
    if (user && isLoggedIn) {
      subscribeToAiChat(user.id, (body: any) => {
        setIsLoading(false) // Stop loading on receive

        // Handle both field names: content (no recipe) or answer (with recipe)
        const aiText = body.answer || body.content || "답변을 불러올 수 없습니다."

        const recs: Recipe[] = (body.recommended_recipes || body.recommendedRecipes || []).map((r: any) => ({
          id: String(r.recipes_id || r.id),
          name: r.title,
          thumbnail: r.main_image_url || r.image,
          duration: r.cook_time ? Number(r.cook_time) : 0,
          servings: r.servings ? Number(r.servings) : 1,
          calories: r.calories ? Number(r.calories) : 0,
          difficulty: "중급",
          likes: 0,
          isLiked: false,
          tags: r.tags || [],
          ingredients: [],
          steps: []
        }))

        const aiMsg: ChatMessage = {
          id: `live-${Date.now()}`,
          role: "assistant",
          content: aiText,
          timestamp: new Date(),
          recipes: recs.length > 0 ? recs : undefined
        }

        setMessages(prev => [...prev, aiMsg])
        if (recs.length > 0) {
          setCurrentRecipes(recs)
          setViewState("recommendations")
        }
      })

      // Cleanup on unmount
      return () => {
        unsubscribeFromAiChat()
      }
    }
  }, [isLoggedIn, user, subscribeToAiChat, unsubscribeFromAiChat])

  React.useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        })
      }, 100)
    }
  }, [messages, viewState]) // trigger on viewState change too (e.g. switching back to chat)

  // Animation Effect (Keep existing)
  React.useEffect(() => {
    if (viewState !== "chat") {
      animationRef.current = false
      return
    }
    animationRef.current = true
    const runAnimation = async () => {
      const tags = ["#tag-korean", "#tag-quick", "#tag-healthy", "#tag-comfort"]
      while (animationRef.current) {
        for (const tag of tags) {
          if (!animationRef.current) break
          try {
            await animate("#pointer", { x: 0, y: 0 }, { duration: 0 })
            const tagEl = scope.current?.querySelector(tag)
            if (!tagEl || !scope.current || !animationRef.current) continue
            const tagRect = tagEl.getBoundingClientRect()
            const scopeRect = scope.current.getBoundingClientRect()
            await animate("#pointer", {
              x: tagRect.left - scopeRect.left + tagRect.width / 2 - 10,
              y: tagRect.top - scopeRect.top + tagRect.height / 2 - 10,
            }, { duration: 0.5, ease: "easeInOut" })
            if (!animationRef.current) break
            await animate(tag, { opacity: 1, scale: 1.05 }, { duration: 0.2 })
            await new Promise((resolve) => setTimeout(resolve, 800))
            if (!animationRef.current) break
            await animate(tag, { opacity: 0.5, scale: 1 }, { duration: 0.2 })
          } catch { break }
        }
      }
    }
    const timer = setTimeout(() => { runAnimation() }, 100)
    return () => {
      animationRef.current = false
      clearTimeout(timer)
    }
  }, [animate, scope, viewState])


  const handleSendMessage = (message: string, image?: string) => {
    if (!message.trim()) return

    // Check if user is logged in
    if (!isLoggedIn || !user) {
      setShowLoginDialog(true)
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message || (image ? "[이미지 첨부]" : ""),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Use AuthContext's WebSocket to send AI message
    sendAiMessage(message)

    // Switch to recommendations view to show split layout
    setViewState("recommendations")
  }

  // Fetch random recipes for completion dialog
  const fetchRandomRecipes = async () => {
    try {
      const response = await getRecipeList({
        recipeType: "USER",
        sort: "LATEST",
        page: Math.floor(Math.random() * 3), // Random page 0-2
        size: 3,
      })

      // Transform backend response to Recipe type
      const recipes: Recipe[] = response.recipes.map((r: RecipeListItem) => ({
        id: String(r.recipeId),
        name: r.title,
        thumbnail: r.mainImageUrl,
        image: r.mainImageUrl,
        tags: r.tags.map((t: { tag_name: string }) => t.tag_name),
        author: r.nickName,
        rating: r.averageRating,
        duration: 0,
        difficulty: "중급",
        servings: 0,
        calorie: 0,
        ingredients: [],
        steps: [],
        isLiked: r.isScrapped,
        isMine: r.isMine,
      }))

      setRecommendedRecipes(recipes)
    } catch (error) {
      console.error("Failed to fetch random recipes:", error)
      setRecommendedRecipes([]) // Empty fallback
    }
  }

  const handleSelectRecipe = async (recipe: Recipe) => {
    try {
      // Fetch full recipe details from backend
      const details = await getRecipeDetail(recipe.id)

      // Transform backend response to Recipe type
      const fullRecipe: Recipe = {
        id: String(details.recipeId),
        name: details.title,
        thumbnail: details.mainImageUrl,
        image: details.mainImageUrl,
        tags: details.tags.map(t => t.tag_name),
        author: details.nickname,
        rating: details.averageRating,
        duration: details.cookTime,
        difficulty: "중급", // You can map this based on backend data if available
        servings: details.servings,
        calorie: details.calorie,
        nutrition: {
          protein: details.protein,
          carbohydrate: details.carbohydrate,
          fat: details.saturatedFat,
          sodium: details.sodium,
          cholesterol: details.cholesterol,
          calcium: details.calcium,
        },
        description: details.description,
        ingredients: details.ingredients.map(ing => ({
          name: ing.ingredient_name,
          amount: ing.ingredient_amount,
        })),
        steps: details.steps.map(step => ({
          id: step.step_number,
          stepNumber: step.step_number,
          action: step.step_description.split('.')[0] || "조리",
          description: step.step_description,
          ingredients: [],
          tools: [],
          duration: step.timer_seconds,
          imageUrl: step.step_imageUrl || "",
          tips: step.cooking_tip || undefined,
        })),
        isLiked: details.isScrapped,
        isMine: details.isMine,
      }

      setSelectedRecipe(fullRecipe)
      setCurrentStepIndex(0)
      setViewState("detail")
    } catch (error) {
      console.error("Failed to fetch recipe details:", error)
      // Fallback to using the basic recipe data
      setSelectedRecipe(recipe)
      setCurrentStepIndex(0)
      setViewState("detail")
    }
  }

  const handleStartCooking = () => {
    setViewState("cooking")
  }

  const handleCompleteCooking = () => {
    setShowCompleteDialog(true)
    fetchRandomRecipes() // Fetch random recipes for recommendation
  }

  const handleBack = () => {
    if (viewState === "cooking") {
      setViewState("detail")
    } else if (viewState === "detail") {
      setViewState("recommendations")
    } else if (viewState === "recommendations") {
      // Logic to go back to initial state? 
      // Usually users want to go back to 'initial' large search if they clear everything
      // But button says 'Back'.
      // If we go back from split view, maybe we go to home?
      // Let's keep it simple:
      setViewState("chat")
      // setMessages([]) // Keep history?
      // setCurrentRecipes([]) 
    }
  }

  const handleSelectLeftover = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setCurrentStepIndex(0)
    setViewState("detail")
  }

  const handleResetToHome = () => {
    setViewState("chat")
    setMessages([])
    setCurrentRecipes([])
    setSelectedRecipe(null)
    setCurrentStepIndex(0)
    setIsLoading(false)
    setShowCompleteDialog(false)
  }

  const handleGoHome = () => {
    setShowCompleteDialog(false)
    handleResetToHome()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar onLogoClick={handleResetToHome} />
      <ScrollToTop />

      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-4 min-h-[calc(100vh-200px)]">
          {/* Back Button */}
          {viewState !== "chat" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-4 text-muted-foreground hover:text-foreground hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <ArrowLeft className="mr-0 h-4 w-4" />
                뒤로 가기
              </Button>
            </motion.div>
          )}

          {/* Status Badge */}
          <div className="mb-0 flex justify-center"></div>

          {/* Chat View (Initial Large Search) */}
          {viewState === "chat" && (
            <div className="space-y-8">
              <div className="relative min-h-[400px] flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 p-8 lg:p-10">
                <motion.div
                  initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="relative h-[240px] w-[280px] shrink-0"
                  ref={scope}
                >
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    >
                      <MichelinIcon
                        size={56}
                        className="bg-[#FEF2F2] shadow-none rounded-2xl"
                        imgClassName="h-10 w-10"
                      />
                    </motion.div>

                  </div>

                  {/* Tags Animation */}
                  <div
                    id="tag-korean"
                    className="absolute bottom-12 left-6 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 opacity-50"
                  >
                    한식
                  </div>
                  <div
                    id="tag-quick"
                    className="absolute left-0 top-12 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 opacity-50"
                  >
                    간편요리
                  </div>
                  <div
                    id="tag-healthy"
                    className="absolute bottom-20 right-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-600 opacity-50"
                  >
                    건강식
                  </div>
                  <div
                    id="tag-comfort"
                    className="absolute right-4 top-4 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-600 opacity-50"
                  >
                    30분컷요리
                  </div>

                  <div id="pointer" className="absolute flex items-start">
                    <svg
                      width="18"
                      height="20"
                      viewBox="0 0 12 13"
                      className="fill-[#800020]"
                      stroke="white"
                      strokeWidth="1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 5.50676L0 0L2.83818 13L6.30623 7.86537L12 5.50676V5.50676Z"
                      />
                    </svg>
                    <Image
                      src="/chef_cursor.png"
                      alt="AI Chef"
                      width={20}
                      height={20}
                      className="relative top-0.5 left-0.5"
                    />
                  </div>
                </motion.div>

                {/* Right: Content */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex items-center gap-2 mb-4"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef2f2]/10 text-[#800020] text-sm font-semibold border border-[#800020]/20">
                      <MichelinIcon
                        size={20}
                        className="bg-transparent shadow-none rounded-none"
                        imgClassName="h-4 w-4"
                      />
                      미슐랭 {isLoggedIn && user ? user.totalStar : 0}스타
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ filter: "blur(10px)", opacity: 0, y: 30 }}
                    animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="font-bold mb-4"
                  >
                    <span className="text-2xl lg:text-[36px] text-foreground leading-tight block">
                      <span className="text-[#800020]">{userCookingProfile.name}</span>님,
                    </span>
                    <span className="text-2xl lg:text-[36px] text-foreground leading-tight block mt-1">
                      오늘은 어떤 요리에 도전하시겠어요?
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-muted-foreground mb-6 text-sm lg:text-base leading-relaxed"
                  >
                    AI가 당신의 취향과 재료에 맞는 레시피를 찾아드려요.
                    <br />
                    핸즈프리로 요리하고, 남은 재료는 이웃과 나눠보세요!
                  </motion.p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
              >
                {/* 검색창만 가로폭 확장 */}
                <div className="w-full">
                  <ClaudeChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    suggestedPrompts={suggestedPrompts}
                    enableImageUpload={false}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {/* Recommendations View (Split Screen) */}
          {viewState === "recommendations" && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
              className="h-[calc(100vh-180px)] flex gap-6"
            >
              {/* Left: Chat History */}
              <div className="w-1/2 flex flex-col border-r pr-6">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
                  <ChatMessageList smooth>
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        {msg.role === "user" && (
                          <ChatBubble variant="sent">
                            <ChatBubbleAvatar
                              className="h-8 w-8 shrink-0"
                              src={user?.profileImage || "/placeholder.svg?height=32&width=32&query=user avatar"}
                              fallback={user?.name?.charAt(0) || userCookingProfile.name.charAt(0)}
                            />
                            <ChatBubbleMessage variant="sent">{msg.content}</ChatBubbleMessage>
                          </ChatBubble>
                        )}
                        {msg.role === "assistant" && (
                          <ChatBubble variant="received">
                            <ChatBubbleAvatar className="h-8 w-8 shrink-0" src="/chef_bot.jpg" fallback="AI" />
                            <ChatBubbleMessage variant="received">{msg.content}</ChatBubbleMessage>
                          </ChatBubble>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <ChatBubble variant="received">
                        <ChatBubbleAvatar className="h-8 w-8 shrink-0" src="/chef_bot.jpg" fallback="AI" />
                        <ChatBubbleMessage isLoading />
                      </ChatBubble>
                    )}
                  </ChatMessageList>
                </div>

                <div className="pt-4 border-t bg-background">
                  <ClaudeChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    placeholder="추가로 궁금한 게 있으면 물어보세요..."
                    enableImageUpload={false}
                  />
                </div>
              </div>

              {/* Right: Recipe Cards */}
              <div className="w-1/2 overflow-y-auto px-2 py-2">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">추천 레시피</h3>
                  <p className="text-sm text-muted-foreground">클릭하여 상세 정보를 확인하세요</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {currentRecipes.length > 0 ? (
                    currentRecipes.map((recipe) => (
                      <Card
                        key={recipe.id}
                        onClick={() => handleSelectRecipe(recipe)}
                        className="cursor-pointer group overflow-hidden transition-all hover:shadow-lg hover:ring-2 hover:ring-[#800020]/30 p-0"
                      >
                        <div className="flex items-center gap-5 px-4 py-3">
                          <div className="relative w-44 aspect-[4/3] shrink-0 overflow-hidden rounded-lg">
                            <img
                              src={recipe.thumbnail || "/placeholder.svg"}
                              alt={recipe.name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <div className="flex flex-col justify-center gap-2">
                            <h4 className="font-bold text-xl leading-snug line-clamp-2">{recipe.name}</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {recipe.tags?.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-xs text-[#800020] font-medium">#{tag}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{recipe.duration}분</span>
                              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{recipe.servings}인분</span>
                              {recipe.calories && (
                                <span className="flex items-center gap-1"><Flame className="h-4 w-4" />{recipe.calories}kcal</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-10">
                      <p>추천된 레시피가 없습니다.</p>
                      <p className="text-sm">AI에게 다른 요리를 물어보세요!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recipe Detail View */}
          {viewState === "detail" && selectedRecipe && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            >
              <RecipeDetailView recipe={selectedRecipe} onStartCooking={handleStartCooking} />
            </motion.div>
          )}

          {/* Cooking Mode View */}
          {viewState === "cooking" && selectedRecipe && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
              className="space-y-6"
            >
              <StepCookMode
                recipeId={Number(selectedRecipe.id)}
                steps={selectedRecipe.steps}
                currentStepIndex={currentStepIndex}
                onStepChange={setCurrentStepIndex}
                onComplete={handleCompleteCooking}
                recipeName={selectedRecipe.name}
              />
            </motion.div>
          )}
        </div>
      </main>

      <CompleteCookDialog
        open={showCompleteDialog}
        onOpenChange={(open) => {
          setShowCompleteDialog(open)
          if (open) fetchRandomRecipes() // Fetch when dialog opens
        }}
        completedRecipe={selectedRecipe}
        leftoverRecipes={recommendedRecipes}

        onSelectLeftover={handleSelectLeftover}
        onGoHome={handleGoHome}
      />

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[450px] gap-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-center">
              로그인이 필요한 서비스입니다
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              AI 레시피 추천 서비스를 이용하려면 로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                setShowLoginDialog(false)
                router.push("/login")
              }}
              className="w-full bg-[#800020] hover:bg-[#800020]/90"
            >
              로그인 하러가기
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowLoginDialog(false)
                router.push("/signup")
              }}
              className="w-full"
            >
              회원가입 하러가기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
