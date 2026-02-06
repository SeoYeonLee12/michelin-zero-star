"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Recipe } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import {
  Clock,
  Users,
  ChefHat,
  Heart,
  Share2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Lightbulb,
  Send,
  MessageCircle,
  Copy,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  Flame,
  Lock,
  CheckCircle,
  Activity,
  Star,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { deleteRecipe } from "@/lib/api/recipes"
import { toggleScrap } from "@/lib/api/scraps"
import { createReview, getRecipeReviews } from "@/lib/api/reviews"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface RecipeDetailViewProps {
  recipe: Recipe
  onStartCooking: () => void
  hasCompletedCooking?: boolean
}

function AnimatedNumber({ value, prevValue }: { value: number; prevValue: number }) {
  const [displayValue, setDisplayValue] = React.useState(prevValue)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsAnimating(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [value, displayValue])

  return (
    <span className="inline-flex overflow-hidden h-4 relative">
      <span
        className={cn(
          "transition-transform duration-150",
          isAnimating && value > displayValue && "-translate-y-full opacity-0",
          isAnimating && value < displayValue && "translate-y-full opacity-0",
        )}
      >
        {displayValue}
      </span>
      {isAnimating && (
        <span
          className={cn(
            "absolute transition-transform duration-150",
            value > displayValue && "translate-y-full animate-slide-up-number",
            value < displayValue && "-translate-y-full animate-slide-down-number",
          )}
        >
          {value}
        </span>
      )}
    </span>
  )
}

function StarRating({ rating, onRatingChange, disabled }: { rating: number; onRatingChange: (r: number) => void; disabled?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1", disabled && "opacity-60")}>
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1
        const filled = rating >= star

        return (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onRatingChange(star)}
            disabled={disabled}
            className={cn(
              "transition-transform",
              disabled ? "cursor-not-allowed" : "hover:scale-110",
            )}
          >
            <img
              src={filled ? "/michelin-full-star.png" : "/michelin-star.png"}
              alt="미슐랭"
              className={cn("h-5 w-5", !filled && "opacity-30")}
              draggable={false}
            />
          </button>
        )
      })}
    </div>
  )
}

const COMMENTS_PER_PAGE = 5

export function RecipeDetailView({ recipe, onStartCooking, hasCompletedCooking = false }: RecipeDetailViewProps) {
  const router = useRouter()
  const { user, hasUserReviewedRecipe, markRecipeAsReviewed } = useAuth()

  const [newComment, setNewComment] = React.useState("")
  const [userRating, setUserRating] = React.useState<number>(0)

  /* State for Review API */
  const [reviews, setReviews] = React.useState<any[]>([])
  const [pageInfo, setPageInfo] = React.useState({
    currentPage: 1,
    size: 20,
    totalElements: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  })
  const [isReviewsLoading, setIsReviewsLoading] = React.useState(false)
  const [showScrapFeedback, setShowScrapFeedback] = React.useState(false)
  const [isScrapped, setIsScrapped] = React.useState(recipe.isLiked || false)
  const [isScrapLoading, setIsScrapLoading] = React.useState(false)
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [nutritionOpen, setNutritionOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Update effect if recipe prop changes
  React.useEffect(() => {
    setIsScrapped(recipe.isLiked || false)
  }, [recipe.isLiked]) // Added back this effect

  const handleEditRecipe = () => {
    router.push(`/recipes/new?id=${recipe.id}`)
  }

  const handleDeleteRecipe = async () => {
    try {
      await deleteRecipe(recipe.id)
      alert("레시피가 삭제되었습니다.")
      router.push("/recipes")
    } catch (error) {
      console.error("Failed to delete recipe:", error)
      alert("레시피 삭제에 실패했습니다.")
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const userAlreadyReviewed = hasUserReviewedRecipe(recipe.id)

  const handleScrap = async () => {
    if (!user) {
      alert("로그인이 필요한 서비스입니다.")
      return
    }

    if (isScrapLoading) return
    setIsScrapLoading(true)

    try {
      // Optimistic update
      const newStatus = !isScrapped
      setIsScrapped(newStatus)

      if (newStatus) {
        setShowScrapFeedback(true)
        setTimeout(() => setShowScrapFeedback(false), 2000)
      }

      // API Call
      await toggleScrap(Number(recipe.id))
    } catch (error) {
      console.error("Failed to toggle scrap:", error)
      setIsScrapped(!isScrapped) // Revert on error
    } finally {
      setIsScrapLoading(false)
    }
  }


  // Fetch Reviews
  const fetchReviews = React.useCallback(async (page: number = 1) => {
    try {
      setIsReviewsLoading(true)
      const data = await getRecipeReviews(Number(recipe.id), page)
      if (data && data.reviews) {
        setReviews(data.reviews)
        setPageInfo(data.pageInfo)
      } else {
        setReviews([])
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
    } finally {
      setIsReviewsLoading(false)
    }
  }, [recipe.id])

  React.useEffect(() => {
    fetchReviews(1)
  }, [fetchReviews])

  const handleSubmitComment = async () => {
    if (!hasCompletedCooking) return
    if (userRating === 0) {
      alert("평점을 선택해주세요.")
      return
    }
    if (!newComment.trim()) {
      alert("댓글 내용을 입력해주세요.")
      return
    }
    if (newComment.length > 100) {
      return
    }

    try {
      await createReview({
        recipeId: Number(recipe.id),
        rating: userRating,
        content: newComment
      })

      // Refresh reviews after submission
      await fetchReviews(1)
      setNewComment("")
      setUserRating(0)

      if (!hasUserReviewedRecipe(recipe.id)) {
        markRecipeAsReviewed(recipe.id)
      }
    } catch (error) {
      console.error("Failed to submit comment:", error)
      alert("댓글 등록에 실패했습니다.")
    }
  }

  // Calculate pages for pagination UI
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pageInfo.totalPages) {
      fetchReviews(newPage)
    }
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredTags = React.useMemo(() => {
    const excludeTags = ["명절", "전통", "파티요리", "파티", "명절요리"]
    return (recipe.hashtags || []).filter(
      (tag) => tag && tag.trim() !== "" && !excludeTags.some((ex) => tag.includes(ex)),
    )
  }, [recipe.hashtags])

  // ✅ 초를 "N분 N초" 형식으로 변환
  const formatCookTime = (seconds: number) => {
    if (!seconds || seconds === 0) return "0초"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes === 0) return `${remainingSeconds}초`
    if (remainingSeconds === 0) return `${minutes}분`
    return `${minutes}분 ${remainingSeconds}초`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {showScrapFeedback && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-foreground text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <span className="text-sm font-medium">스크랩했습니다</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Image (5:5 ratio) */}
        <div className="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden bg-muted shadow-2xl group">
          <Image src={recipe.thumbnail || "/placeholder.svg"} alt={recipe.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>

        {/* Right: Info */}
        <div className="space-y-4 min-w-0">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold break-words">{recipe.name}</h1>
            {recipe.description && (
              <div className="space-y-4">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-all">
                  {recipe.description}
                </p>

                {/* Tags */}
                {filteredTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {filteredTags.map((tag, index) => (
                      <span key={index} className="text-xs text-primary font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>


          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <Image src="/michelin-star.png" alt="Star" width={16} height={16} />
              <span className="text-sm font-bold text-[#800020]">{recipe.averageRating ? recipe.averageRating.toFixed(1) : "0.0"}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#800020]" />
              <span>
                {formatCookTime(
                  recipe.steps.reduce((acc, step) => acc + (step.duration || 0), 0) || recipe.duration
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#800020]" />
              <span>{recipe.servings}인분</span>
            </div>
            {(recipe.calories || recipe.calorie) && (
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-[#800020]" />
                <span>{recipe.calories || recipe.calorie}kcal</span>
                <Collapsible open={nutritionOpen} onOpenChange={setNutritionOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-0.5 hover:text-foreground transition-colors ml-1">
                      <ChevronDown className={cn("h-3 w-3 transition-transform", nutritionOpen && "rotate-180")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="absolute mt-2 z-10">
                    <div className="p-3 bg-card border rounded-lg shadow-lg text-xs space-y-1 min-w-[200px]">
                      <p className="font-medium text-foreground mb-2">영양정보</p>
                      {recipe.nutrition ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {recipe.nutrition.protein !== undefined && (
                            <div className="flex justify-between">
                              <span>단백질</span>
                              <span className="font-medium">{recipe.nutrition.protein}g</span>
                            </div>
                          )}
                          {recipe.nutrition.carbs !== undefined && (
                            <div className="flex justify-between">
                              <span>탄수화물</span>
                              <span className="font-medium">{recipe.nutrition.carbs}g</span>
                            </div>
                          )}
                          {recipe.nutrition.fat !== undefined && (
                            <div className="flex justify-between">
                              <span>지방</span>
                              <span className="font-medium">{recipe.nutrition.fat}g</span>
                            </div>
                          )}
                          {recipe.nutrition.fiber !== undefined && (
                            <div className="flex justify-between">
                              <span>식이섬유</span>
                              <span className="font-medium">{recipe.nutrition.fiber}g</span>
                            </div>
                          )}
                          {recipe.nutrition.sodium !== undefined && (
                            <div className="flex justify-between">
                              <span>나트륨</span>
                              <span className="font-medium">{recipe.nutrition.sodium}mg</span>
                            </div>
                          )}
                          {recipe.nutrition.sugar !== undefined && (
                            <div className="flex justify-between">
                              <span>당류</span>
                              <span className="font-medium">{recipe.nutrition.sugar}g</span>
                            </div>
                          )}
                          {recipe.nutrition.cholesterol !== undefined && (
                            <div className="flex justify-between">
                              <span>콜레스테롤</span>
                              <span className="font-medium">{recipe.nutrition.cholesterol}mg</span>
                            </div>
                          )}
                          {recipe.nutrition.calcium !== undefined && (
                            <div className="flex justify-between">
                              <span>칼슘</span>
                              <span className="font-medium">{recipe.nutrition.calcium}mg</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">영양정보가 없습니다</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full bg-transparent ${isScrapped ? "text-red-500 border-red-500 hover:text-red-600" : ""}`}
              onClick={handleScrap}
            >
              <Heart className={`h-4 w-4 ${isScrapped ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-transparent"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            {recipe.isMine && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-transparent"
                  onClick={handleEditRecipe}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-transparent text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Author Info */}
          {recipe.recipeType !== "CHEF" && typeof recipe.author !== "string" && recipe.author && (
            <div className="flex items-center gap-2 pt-4 border-t mt-4">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={recipe.author.image} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                  {recipe.author.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-foreground">{recipe.author.name}</span>
                <div className="flex items-center gap-1 bg-[#FFF0F0] px-2.5 py-1 rounded-full border border-[#FFE0E0]">
                  <img src="/michelin-star.png" alt="Michelin" className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold text-[#800020]">
                    미슐랭 {(recipe.author.totalStars ?? 0).toFixed(1)}스타
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#800020]">레시피</h2>
        <div className="relative space-y-0 pl-1 sm:pl-4">
          <div className="absolute left-[23px] sm:left-[31px] top-10 bottom-10 w-px bg-gray-200" />

          {recipe.steps.map((step, idx) => {
            const tipMatch = step.description.match(/\[TIP\]\s*(.*)/i);
            const cleanDescription = tipMatch ? step.description.replace(/\[TIP\].*/i, "").trim() : step.description;
            const extractedTip = tipMatch ? tipMatch[1].trim() : step.tips;

            return (
              <div key={step.id} className="relative group pb-12 last:pb-4">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative z-10 flex-shrink-0 mt-2">
                    <div className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center transition-colors group-hover:border-[#800020]/30 group-hover:bg-[#800020] group-hover:text-white duration-300">
                      <span className="text-lg font-bold">{step.stepNumber}</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex flex-col lg:flex-row gap-8 items-start min-w-0">
                    {step.imageUrl && (
                      <div className="relative w-full lg:w-[240px] aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow shrink-0">
                        <Image
                          src={step.imageUrl}
                          alt={`Step ${step.stepNumber}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-center space-y-5 pt-1 min-w-0">
                      <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-normal whitespace-pre-wrap break-all">
                        {cleanDescription}
                      </p>

                      {extractedTip && (
                        <div className="flex items-center gap-4 py-3 px-5 rounded-2xl bg-[#800020]/5 border border-[#800020]/5 hover:border-[#800020]/15 transition-all duration-300">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white shadow-sm border border-[#800020]/10">
                            <Image
                              src="/chef-tip.png"
                              alt="Tip icon"
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-extrabold text-[#800020] tracking-wider uppercase text-[9px] opacity-70">Expert Tip</span>
                            <span className="text-sm text-foreground/80 font-medium leading-normal">{extractedTip}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Comments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#800020] flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            댓글 {pageInfo.totalElements}개
          </h2>
        </div>

        <div
          className={cn(
            "p-3 bg-muted/50 rounded-xl space-y-2",
            !hasCompletedCooking && "opacity-60",
          )}
        >
          {!hasCompletedCooking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <Lock className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700">요리를 완료한 후 평점과 댓글을 남길 수 있습니다</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <StarRating rating={userRating} onRatingChange={setUserRating} disabled={!hasCompletedCooking} />
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!hasCompletedCooking || !newComment.trim()}
              className="bg-[#800020] hover:bg-[#800020]/90 text-white"
            >
              등록
            </Button>
          </div>
          <div className="relative">
            <Textarea
              placeholder={
                !hasCompletedCooking
                  ? "요리를 완료한 후 댓글을 작성할 수 있습니다"
                  : "이 레시피에 대한 의견을 남겨주세요 (최대 100자)"
              }
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (e.target.value.length <= 100) {
                  setNewComment(e.target.value)
                }
              }}
              disabled={!hasCompletedCooking}
              className="min-h-[100px] bg-background resize-none focus-visible:ring-[#800020] pr-2 pb-6"
            />
            {hasCompletedCooking && !userAlreadyReviewed && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                <span className={newComment.length > 100 ? "text-red-500 font-bold" : ""}>{newComment.length}</span>/100
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            reviews.map((review: any) => (
              <div
                key={review.reviewId}
                className="group p-4 bg-background border border-gray-100 rounded-2xl shadow-sm hover:border-[#800020]/20 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border border-[#800020]/10 flex-shrink-0">
                    <AvatarImage src={review.userProfileImage || "/placeholder.svg"} />
                    <AvatarFallback className="bg-[#800020]/5 text-[#800020] font-bold">
                      {review.nickName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Header: User Info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground">{review.nickName}</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-200 bg-white shadow-sm">
                        <img src="/michelin-star.png" alt="Michelin" className="w-3 h-3" />
                        <span className="text-[10px] font-bold text-[#800020] leading-none pt-0.5">미슐랭 {review.totalStar || 0}스타</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(review.reviewCreateDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Sub-header: Rating */}
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <img
                          key={i}
                          src={i < review.rating ? "/michelin-full-star.png" : "/michelin-star.png"}
                          alt=""
                          className={cn("h-3 w-3", i >= review.rating && "opacity-30")}
                        />
                      ))}
                    </div>

                    {/* Body: Comment Text */}
                    <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-line break-words">
                      {review.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {pageInfo.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pageInfo.currentPage - 1)}
              disabled={!pageInfo.hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {pageInfo.currentPage} / {pageInfo.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pageInfo.currentPage + 1)}
              disabled={!pageInfo.hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={recipe.thumbnail || "/placeholder.svg"}
                alt={recipe.name}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="hidden sm:block">
              <p className="font-medium text-sm line-clamp-1">{recipe.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCookTime(
                  recipe.steps.reduce((acc, step) => acc + (step.duration || 0), 0) || recipe.duration
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={onStartCooking}
            size="lg"
            className="bg-[#800020] hover:bg-[#800020]/90 text-white shadow-lg shadow-[#800020]/25 px-8"
          >
            <ChefHat className="h-5 w-5 mr-2" />
            요리 시작하기
          </Button>
        </div>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <h3 className="font-semibold">공유하기</h3>
            <div className="flex items-center gap-2">
              <Input value={typeof window !== "undefined" ? window.location.href : ""} readOnly className="flex-1" />
              <Button onClick={handleCopyUrl} className="bg-[#800020] hover:bg-[#800020]/90">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {copied && <p className="text-sm text-green-600">URL이 복사되었습니다!</p>}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>레시피 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 레시피를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecipe} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}