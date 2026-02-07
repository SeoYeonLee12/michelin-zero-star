"use client"

import { useState, useEffect, useRef } from "react"
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
import { toggleScrap } from "@/lib/api/scraps"
import { createReview } from "@/lib/api/reviews"

interface CompleteCookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  completedRecipe: Recipe | null
  leftoverRecipes: Recipe[]
  onSelectLeftover: (recipe: Recipe) => void
  onGoHome?: () => void
  isAwarded?: boolean
}

export function CompleteCookDialog({
  open,
  onOpenChange,
  completedRecipe,
  leftoverRecipes,
  onSelectLeftover,
  onGoHome,
  isAwarded = true,
}: CompleteCookDialogProps) {
  const router = useRouter()
  const {
    isLoggedIn,
    user,
    markRecipeAsCompleted,
    hasUserReviewedRecipe,
    markRecipeAsReviewed,
    earnStars,
    refreshUser,
  } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [scrapFeedback, setScrapFeedback] = useState<string | null>(null)

  // Local scrap states
  const [completedScrapped, setCompletedScrapped] = useState(false)
  const [recommendationScrapped, setRecommendationScrapped] = useState<Record<string, boolean>>({})

  const [showRewardAnimation, setShowRewardAnimation] = useState(false)

  const userHasReviewed = completedRecipe ? hasUserReviewedRecipe(completedRecipe.id) : false
  const rewardProcessed = useRef(false)

  // Initialize scrap states
  useEffect(() => {
    if (completedRecipe) {
      setCompletedScrapped(!!completedRecipe.isLiked)
    }
  }, [completedRecipe])

  useEffect(() => {
    const initialStates: Record<string, boolean> = {}
    leftoverRecipes.forEach(recipe => {
      initialStates[recipe.id] = !!recipe.isLiked
    })
    setRecommendationScrapped(initialStates)
  }, [leftoverRecipes])

  useEffect(() => {
    if (open && completedRecipe?.id && !rewardProcessed.current) {
      rewardProcessed.current = true
      markRecipeAsCompleted(completedRecipe.id)

      if (isAwarded) {
        // earnStars(0.5, "cook") // ❌ Removed local optimistic update to prevent sync issues
        refreshUser()
      }

      setShowRewardAnimation(true)
    }
  }, [open, completedRecipe?.id, markRecipeAsCompleted, refreshUser, isAwarded])


  if (!completedRecipe) return null
  if (!open) return null

  const handleLikeCompletedRecipe = async () => {
    if (!isLoggedIn) return

    const wasLiked = completedScrapped
    setCompletedScrapped(!wasLiked) // Optimistic

    if (!wasLiked) {
      setScrapFeedback("스크랩했습니다")
      setTimeout(() => setScrapFeedback(null), 2000)
    }

    try {
      await toggleScrap(Number(completedRecipe.id))
    } catch (error) {
      console.error("Failed to toggle scrap:", error)
      setCompletedScrapped(wasLiked) // Revert
    }
  }

  const handleLikeRecommendation = async (recipeId: string) => {
    if (!isLoggedIn) return

    const wasLiked = recommendationScrapped[recipeId] || false
    setRecommendationScrapped(prev => ({ ...prev, [recipeId]: !wasLiked })) // Optimistic

    if (!wasLiked) {
      setScrapFeedback("스크랩했습니다")
      setTimeout(() => setScrapFeedback(null), 2000)
    }

    try {
      await toggleScrap(Number(recipeId))
    } catch (error) {
      console.error("Failed to toggle scrap:", error)
      setRecommendationScrapped(prev => ({ ...prev, [recipeId]: wasLiked })) // Revert
    }
  }


  const handleSubmitReview = async () => {
    if (rating === 0 || !isLoggedIn) return
    if (!comment.trim()) {
      alert("후기 내용을 입력해주세요.")
      return
    }
    if (comment.length > 100) {
      alert("후기는 100자 이내로 작성해주세요.")
      return
    }

    try {
      await createReview({
        recipeId: Number(completedRecipe.id),
        rating: rating,
        content: comment
      })

      if (!hasUserReviewedRecipe(completedRecipe.id)) {
        markRecipeAsReviewed(completedRecipe.id)
      }
      setReviewSubmitted(true)
    } catch (error) {
      console.error("Failed to submit review:", error)
      alert("리뷰 등록에 실패했습니다.")
    }
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
          {/* Header */}
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
              {showRewardAnimation && (
                <div className="flex justify-center mt-4 mb-2">
                  {isAwarded ? (
                    <StarRewardBadge
                      amount={0.5}
                      customText="0.5스타 적립"
                      layout="horizontal"
                      starSize="sm"
                      textSize="sm"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
                      오늘의 스타를 모두 획득했어요!
                    </div>
                  )}
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xl mb-0.5 leading-tight line-clamp-2 break-words">{completedRecipe.name}</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {completedScrapped ? "즐겨찾기에 저장됨" : "하트를 눌러 즐겨찾기에 저장하세요"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-transparent" onClick={handleLikeCompletedRecipe}>
                  <Heart
                    className={cn(
                      "h-8 w-8 transition-all",
                      completedScrapped ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500",
                    )}
                  />
                </Button>
              </CardContent>
            </Card>

            {reviewSubmitted ? (
              <div className="p-6 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">후기가 등록되었습니다!</h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">소중한 의견 감사합니다</p>
                <Button variant="link" className="mt-2 text-green-700" onClick={() => setReviewSubmitted(false)}>
                  다른 후기 또 남기기
                </Button>
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
                          aria-label={`${star} 점`}
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
                  <div className="relative">
                    <Textarea
                      id="comment"
                      placeholder="요리 후기를 남겨주세요... (최대 100자)"
                      value={comment}
                      onChange={(e) => {
                        if (e.target.value.length <= 100) {
                          setComment(e.target.value)
                        }
                      }}
                      rows={3}
                      className="resize-none pr-2 pb-6"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                      <span className={comment.length >= 100 ? "text-[#800020] font-bold" : ""}>{comment.length}</span>/100
                    </div>
                  </div>
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
                          recommendationScrapped[recipe.id] ? "text-red-500" : "text-muted-foreground",
                          "hover:bg-transparent"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLikeRecommendation(recipe.id)
                        }}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5",
                            recommendationScrapped[recipe.id] ? "fill-red-500 text-red-500" : "text-muted-foreground",
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

