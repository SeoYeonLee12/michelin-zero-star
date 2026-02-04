"use client"

import { useState, useEffect } from "react"
import { PartyPopper, Clock, Heart, Send, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Recipe } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { StarRewardBadge } from "./star-reward-badge"
import { AnimatePresence } from "framer-motion"

interface CompleteCookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  completedRecipe: Recipe | null
  leftoverRecipes: Recipe[]
  onSelectLeftover: (recipe: Recipe) => void
  onGoHome?: () => void
}

export function CompleteCookDialog({
  open,
  onOpenChange,
  completedRecipe,
  leftoverRecipes,
  onSelectLeftover,
  onGoHome,
}: CompleteCookDialogProps) {
  const router = useRouter()
  const {
    toggleLikeRecipe,
    isRecipeLiked,
    isLoggedIn,
    user,
    markRecipeAsCompleted,
    hasUserReviewedRecipe,
    markRecipeAsReviewed,
    earnStars,
  } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [scrapFeedback, setScrapFeedback] = useState<string | null>(null)
  const [starsEarned, setStarsEarned] = useState(false)

  // NOTE: "요리 완료"(completed)와 "리뷰 작성"(reviewed)은 의미가 다르므로 분리합니다.
  // 리뷰 여부는 derived 값으로 계산해 상태 꼬임을 방지합니다.
  const userHasReviewed = completedRecipe ? hasUserReviewedRecipe(completedRecipe.id) : false

  // 다이얼로그가 열리는 시점 = 요리 완료 시점으로 보고 completed 기록
  useEffect(() => {
    if (open && completedRecipe?.id) {
      markRecipeAsCompleted(completedRecipe.id)
      earnStars(0.5, "cook")
      setStarsEarned(true) // Always show the reward UI when completion modal opens
    }
  }, [open, completedRecipe?.id, markRecipeAsCompleted, earnStars])


  if (!completedRecipe) return null

  const isCompletedRecipeLiked = isRecipeLiked(completedRecipe.id)



  const handleLikeCompletedRecipe = () => {
    if (!isLoggedIn) return
    const wasLiked = isRecipeLiked(completedRecipe.id)

    toggleLikeRecipe({
      id: completedRecipe.id,
      title: completedRecipe.name,
      image: completedRecipe.thumbnail || "/placeholder.svg",
      author: completedRecipe.hashtags?.[0] || "미슐랭 0스타",
      savedAt: "",
    })

    if (!wasLiked) {
      setScrapFeedback("스크랩했습니다")
      setTimeout(() => setScrapFeedback(null), 2000)
    }
  }


  const handleSubmitReview = () => {
    if (rating === 0 || !isLoggedIn) return
    console.log("Review submitted as recipe comment:", { rating, comment, recipeId: completedRecipe.id, userId: user?.id })
    // 리뷰는 레시피당 1회만 허용
    if (!hasUserReviewedRecipe(completedRecipe.id)) {
      markRecipeAsReviewed(completedRecipe.id)
    }
    setReviewSubmitted(true)
  }

  const handleGoHomeClick = () => {
    onOpenChange(false)
    if (onGoHome) {
      onGoHome()
    } else {
      router.push("/")
    }
  }

  const handleBackToCooking = () => {
    onOpenChange(false)
  }

  // completedRecipe 없으면 렌더 안 함
  if (!completedRecipe) return null
  // open 아닐 때도 렌더 안 함 (Radix 제거 핵심)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header (DialogHeader 대체) */}
          <div className="text-center pt-6 pb-2">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <PartyPopper className="h-12 w-12 text-[#800020]" />
                <div className="absolute inset-0 bg-[#800020]/10 blur-xl rounded-full -z-10" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">요리 완료!</h2>
            <p className="text-gray-400 font-medium mt-2">
              <span className="text-[#800020]">{completedRecipe.name}</span>을(를) 완벽하게 완성했습니다.
            </p>

            <AnimatePresence mode="wait">
              {starsEarned && (
                <div className="flex justify-center mt-4 mb-2">
                  <StarRewardBadge
                    amount={0.5}
                    customText="0.5스타 적립"
                    layout="horizontal"
                    starSize="sm"
                    textSize="sm"
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6 mt-4">
            {/* Completed Recipe Summary */}
            <Card className="border-[#800020]/20 bg-[#800020]/5">
              <CardContent className="flex items-center gap-4 py-1 px-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted shrink-0 shadow-md">
                  <img
                    src={completedRecipe.thumbnail || "/placeholder.svg"}
                    alt={completedRecipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-xl mb-0.5 leading-tight">{completedRecipe.name}</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {isCompletedRecipeLiked ? "즐겨찾기에 저장됨" : "하트를 눌러 즐겨찾기에 저장하세요"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-transparent" onClick={handleLikeCompletedRecipe}>
                  <Heart
                    className={cn(
                      "h-8 w-8 transition-all",
                      isCompletedRecipeLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500",
                    )}
                  />
                </Button>
              </CardContent>
            </Card>

            {reviewSubmitted ? (
              <div className="p-6 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">후기가 등록되었습니다!</h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">레시피 댓글에 후기가 추가되었어요</p>
              </div>
            ) : userHasReviewed ? (
              <div className="p-6 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300">이미 후기를 남기셨습니다!</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">한 레시피당 하나의 후기만 남길 수 있습니다</p>
              </div>
            ) : (
              <div className="space-y-4 p-6 bg-white border border-[#800020]/10 shadow-[0_4px_20px_-4px_rgba(128,0,32,0.08)] rounded-2xl">
                <div className="space-y-2">
                  <Label className="text-base font-medium">이 레시피에 별점을 남겨주세요</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110"
                          aria-label={`${star}점`}
                        >
                          <img
                            src={active ? "/michelin-full-star.png" : "/michelin-star.png"}
                            alt="미슐랭"
                            className="h-8 w-8"
                          />
                        </button>
                      )
                    })}
                  </div>

                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-base font-medium">
                    댓글 남기기
                  </Label>
                  <Textarea
                    id="comment"
                    placeholder="요리 후기를 남겨주세요..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={rating === 0 || !isLoggedIn}
                  className="w-full gap-2 bg-[#800020] hover:bg-[#800020]/90"
                >
                  <Send className="h-4 w-4" />
                  리뷰 등록하기
                </Button>
                {!isLoggedIn && (
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/login")}>
                    로그인하여 리뷰 남기기
                  </Button>
                )}
              </div>
            )}

            {scrapFeedback && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                <div className="bg-foreground text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  <span className="text-sm font-medium">{scrapFeedback}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#800020]" />
                <span className="text-base font-bold">추천 레시피</span>
              </div>
              <p className="text-sm text-muted-foreground">하트를 눌러 나중에 만들어볼 레시피에 저장하세요</p>
              <div className="grid gap-3">
                {leftoverRecipes.map((recipe) => (
                  <Card key={recipe.id} className="cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-4 py-1 px-4">
                      <img
                        src={recipe.thumbnail || "/placeholder.svg"}
                        alt={recipe.name}
                        className="h-24 w-24 rounded-2xl object-cover shadow-sm"
                      />
                      <div
                        className="flex-1"
                        onClick={() => {
                          onSelectLeftover(recipe)
                          onOpenChange(false)
                        }}
                      >
                        <p className="font-semibold text-lg leading-tight mb-1">{recipe.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {(recipe.tags && recipe.tags.length > 0) ? (
                            recipe.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="text-xs text-[#800020] font-normal">
                                #{tag}
                              </span>
                            ))
                          ) : (recipe.hashtags && recipe.hashtags.length > 0) ? (
                            recipe.hashtags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs text-blue-600 font-normal">
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 font-normal italic">
                              #추천레시피
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "gap-2",
                          isRecipeLiked(recipe.id) ? "text-red-500" : "text-muted-foreground",
                          "hover:bg-transparent"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLikeRecipe({
                            id: recipe.id,
                            title: recipe.name,
                            image: recipe.thumbnail || "/placeholder.svg",
                            author: typeof recipe.author === "object" ? recipe.author?.name || "" : String(recipe.author || ""),
                            savedAt: "",
                          })
                        }}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5",
                            isRecipeLiked(recipe.id) ? "fill-red-500 text-red-500" : "text-muted-foreground",
                          )}
                        />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent gap-2" onClick={handleBackToCooking}>
                <ArrowLeft className="h-4 w-4" />
                요리로 돌아가기
              </Button>
              <Button className="flex-1 bg-[#800020] hover:bg-[#800020]/90 gap-2" onClick={handleGoHomeClick}>
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

}
