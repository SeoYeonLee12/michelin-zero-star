"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ThumbsUp,
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

const mockComments = [
  {
    id: 1,
    visitorId: "user1",
    user: "김대전",
    avatar: "/korean-woman-avatar.jpg",
    text: "정말 맛있게 만들었어요! 가족들이 너무 좋아했어요.",
    rating: 5,
    time: "2일 전",
    likes: 12,
    starLevel: 3,
  },
  {
    id: 2,
    visitorId: "user2",
    user: "박요리",
    avatar: "/korean-man-avatar.jpg",
    text: "초보자도 따라하기 쉬웠습니다. 감사합니다!",
    rating: 4,
    time: "5일 전",
    likes: 8,
    starLevel: 1,
  },
  {
    id: 3,
    visitorId: "user3",
    user: "이맛집",
    avatar: "/young-korean-woman-avatar.jpg",
    text: "양념 비율이 딱 좋아요. 다음에 또 만들 예정!",
    rating: 5,
    time: "1주 전",
    likes: 5,
    starLevel: 5,
  },
]

const COMMENTS_PER_PAGE = 5

export function RecipeDetailView({ recipe, onStartCooking, hasCompletedCooking = false }: RecipeDetailViewProps) {
  const router = useRouter()
  const { user, hasUserReviewedRecipe, toggleLikeRecipe, isRecipeLiked } = useAuth()

  const [newComment, setNewComment] = React.useState("")
  const [userRating, setUserRating] = React.useState<number>(0)
  const [likedComments, setLikedComments] = React.useState<Set<number>>(new Set())
  const [showScrapFeedback, setShowScrapFeedback] = React.useState(false)
  const [prevLikeCounts, setPrevLikeCounts] = React.useState<Record<number, number>>({})
  const [comments, setComments] = React.useState(mockComments)
  const [commentSort, setCommentSort] = React.useState<"latest" | "likes">("latest")
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null)
  const [editingText, setEditingText] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [recipeRating, setRecipeRating] = React.useState(4.5)
  const [nutritionOpen, setNutritionOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false)

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
  const isLiked = isRecipeLiked(recipe.id)

  const allIngredients = React.useMemo(() => {
    const ingredientMap = new Map<string, string>()
    recipe.steps.forEach((step) => {
      if (step.ingredients && Array.isArray(step.ingredients)) {
        step.ingredients.forEach((ing) => {
          const match = ing.match(/^(.+?)\s*([\d.]+.*)$/)
          if (match) {
            ingredientMap.set(match[1], match[2])
          } else {
            ingredientMap.set(ing, "적당량")
          }
        })
      }
    })

    // Also check for recipe-level ingredients (from new recipe form)
    if (ingredientMap.size === 0 && recipe.ingredients) {
      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((ing) => {
          ingredientMap.set(ing.name, ing.amount || "적당량")
        })
      }
    }

    return Array.from(ingredientMap.entries())
  }, [recipe])

  const sortedComments = React.useMemo(() => {
    const sorted = [...comments]
    if (commentSort === "likes") {
      sorted.sort((a, b) => {
        const aLikes = a.likes + (likedComments.has(a.id) ? 1 : 0)
        const bLikes = b.likes + (likedComments.has(b.id) ? 1 : 0)
        return bLikes - aLikes
      })
    }
    return sorted
  }, [comments, commentSort, likedComments])

  const totalPages = Math.ceil(sortedComments.length / COMMENTS_PER_PAGE)
  const paginatedComments = sortedComments.slice((currentPage - 1) * COMMENTS_PER_PAGE, currentPage * COMMENTS_PER_PAGE)

  const handleSubmitComment = () => {
    if (!hasCompletedCooking) return
    if (!newComment.trim()) return

    const newCommentObj = {
      id: Date.now(),
      visitorId: user?.id || "current-user",
      user: user?.name || "나",
      avatar: user?.profileImage || "/placeholder.svg",
      text: newComment,
      rating: userRating,
      time: "방금 전",
      likes: 0,
      starLevel: 0,
    }

    setComments((prev) => [newCommentObj, ...prev])
    setNewComment("")
    setUserRating(0)
    setCurrentPage(1)
  }

  const handleLikeComment = (commentId: number, currentLikes: number) => {
    const isCurrentlyLiked = likedComments.has(commentId)
    const newLikeCount = currentLikes + (isCurrentlyLiked ? -1 : 1)
    setPrevLikeCounts((prev) => ({ ...prev, [commentId]: newLikeCount }))

    setLikedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) newSet.delete(commentId)
      else newSet.add(commentId)
      return newSet
    })
  }

  const handleScrap = () => {
    const wasLiked = isRecipeLiked(recipe.id)

    toggleLikeRecipe({
      id: recipe.id,
      title: recipe.name,
      image: recipe.thumbnail || "/placeholder.svg",
      author: typeof recipe.author === "object" ? recipe.author?.name || "" : recipe.author || "",
      savedAt: "",
    })

    if (!wasLiked) {
      setShowScrapFeedback(true)
      setTimeout(() => setShowScrapFeedback(false), 2000)
    }
  }

  const handleRatingClick = (star: number) => {
    if (!hasCompletedCooking) return
    if (userRating === star) setUserRating(0)
    else setUserRating(star)
  }

  const handleDeleteComment = (commentId: number) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  const handleEditComment = (commentId: number, text: string) => {
    setEditingCommentId(commentId)
    setEditingText(text)
  }

  const handleSaveEdit = (commentId: number) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, text: editingText } : c)))
    setEditingCommentId(null)
    setEditingText("")
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

  // ✅ 레시피 평점 표시 전용(부분 채움: 4.5 -> 4 full + 1 half)
  const renderRecipeRatingFlowers = (value: number) => {
    const rating = Number.isFinite(value) ? value : 0
    const fullCount = Math.floor(rating)
    const hasHalf = rating % 1 !== 0

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((idx) => {
            if (idx <= fullCount) {
              return (
                <img key={idx} src="/michelin-full-star.png" alt="미슐랭" className="h-5 w-5" draggable={false} />
              )
            }

            if (idx === fullCount + 1 && hasHalf) {
              return <img key={idx} src="/michelin-star-half.png" alt="미슐랭 반" className="h-5 w-5" draggable={false} />
            }

            return (
              <img
                key={idx}
                src="/michelin-star.png"
                alt="미슐랭 빈"
                className="h-5 w-5"
                draggable={false}
              />
            )
          })}
        </div>

        <span className="text-sm text-[#800020] font-medium">{rating.toFixed(1)}</span>
      </div>
    )
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
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{recipe.name}</h1>
            {recipe.description && (
              <div>
                {!isDescriptionExpanded ? (
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {recipe.description}
                    </p>
                    {recipe.description.length > 100 && (
                      <button
                        onClick={() => setIsDescriptionExpanded(true)}
                        className="text-xs text-[#800020] hover:underline mt-1 font-medium"
                      >
                        전체보기
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative animate-in slide-in-from-top-1 fade-in duration-200 w-full">
                    <div className="min-h-[200px] max-h-[400px] overflow-y-auto overflow-x-hidden p-4 border rounded-xl bg-muted/30 text-sm text-muted-foreground whitespace-pre-wrap break-all leading-relaxed shadow-sm">
                      {recipe.description}
                    </div>
                    <button
                      onClick={() => setIsDescriptionExpanded(false)}
                      className="text-xs text-[#800020] hover:underline mt-1 font-medium"
                    >
                      접기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full bg-transparent ${isLiked ? "text-red-500 border-red-500 hover:text-red-600" : ""}`}
              onClick={handleScrap}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
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

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
        </div>
      </div>

      <Separator />

      {/* Ingredients */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[#800020]">재료</h2>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {allIngredients.map(([name, amount], idx) => (
            <div key={idx} className="flex justify-between items-center px-3 py-2 rounded-lg bg-muted">
              <span className="font-medium text-sm">{name}</span>
              <span className="text-muted-foreground text-xs">{amount}</span>
            </div>
          ))}
        </div>
        {/* ✅ 수정사항 반영: '대체 재료 알아보기' 및 AI 챗봇(다이얼로그) 삭제 */}
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#800020]">레시피</h2>
        <div className="relative space-y-0 pl-1 sm:pl-4">
          {/* Simple Modern Timeline Line */}
          <div className="absolute left-[23px] sm:left-[31px] top-10 bottom-10 w-px bg-gray-200" />

          {recipe.steps.map((step, idx) => {
            // TIP Extraction Logic
            const tipMatch = step.description.match(/\[TIP\]\s*(.*)/i);
            const cleanDescription = tipMatch ? step.description.replace(/\[TIP\].*/i, "").trim() : step.description;
            const extractedTip = tipMatch ? tipMatch[1].trim() : step.tips;

            return (
              <div key={step.id} className="relative group pb-12 last:pb-4">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Minimal Step Number Badge */}
                  <div className="relative z-10 flex-shrink-0 mt-2">
                    <div className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center transition-colors group-hover:border-[#800020]/30 group-hover:bg-[#800020] group-hover:text-white duration-300">
                      <span className="text-lg font-bold">{step.stepNumber}</span>
                    </div>
                  </div>

                  {/* Minimal Step Plate (No cards, no tags) */}
                  <div className="flex-1 w-full flex flex-col lg:flex-row gap-8 items-start">
                    {step.imageUrl && (
                      <div className="relative w-full lg:w-[240px] aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow">
                        <Image
                          src={step.imageUrl}
                          alt={`Step ${step.stepNumber}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-center space-y-5 pt-1">
                      <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-normal">
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
            댓글 {comments.length}개
          </h2>
          <Select value={commentSort} onValueChange={(v: string) => setCommentSort(v as "latest" | "likes")}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="likes">추천순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          className={cn(
            "p-3 bg-muted/50 rounded-xl space-y-2",
            !hasCompletedCooking && "opacity-60",
            userAlreadyReviewed && "bg-amber-50/50 border border-amber-100",
          )}
        >
          {!hasCompletedCooking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <Lock className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700">요리를 완료한 후 평점과 댓글을 남길 수 있습니다</span>
            </div>
          )}
          {userAlreadyReviewed && (
            <div className="flex items-center gap-2 text-sm text-amber-700 mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <CheckCircle className="h-4 w-4 text-amber-600" />
              <span>이미 이 레시피에 평점과 댓글을 남기셨습니다</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <StarRating rating={userRating} onRatingChange={setUserRating} disabled={!hasCompletedCooking || userAlreadyReviewed} />
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!hasCompletedCooking || userAlreadyReviewed || !newComment.trim()}
              className="bg-[#800020] hover:bg-[#800020]/90 text-white"
            >
              등록
            </Button>
          </div>
          <Textarea
            placeholder={
              !hasCompletedCooking
                ? "요리를 완료한 후 댓글을 작성할 수 있습니다"
                : userAlreadyReviewed
                  ? "이미 댓글을 작성하셨습니다"
                  : "이 레시피에 대한 의견을 남겨주세요"
            }
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
            disabled={!hasCompletedCooking || userAlreadyReviewed}
            className="min-h-[100px] bg-background resize-none focus-visible:ring-[#800020]"
          />
        </div>

        <div className="space-y-4 mt-6">
          {comments.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            paginatedComments.map((comment: any) => (
              <div
                key={comment.id}
                className="group p-4 bg-background border border-gray-100 rounded-2xl shadow-sm hover:border-[#800020]/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#800020]/10">
                      <AvatarImage src={comment.avatar} />
                      <AvatarFallback className="bg-[#800020]/5 text-[#800020] font-bold">
                        {comment.user[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{comment.user}</span>
                        <div className="flex items-center bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-600 border border-amber-100">
                          <img src="/michelin-full-star.png" className="h-2.5 w-2.5 mr-0.5" />
                          {comment.rating.toFixed(1)}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {comment.time}
                      </span>
                    </div>
                  </div>
                  {(comment.visitorId === user?.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-line pl-13">
                  {comment.text}
                </p>
                <div className="mt-3 flex items-center gap-4 pl-13">
                  <button
                    onClick={() => handleLikeComment(comment.id, comment.likes)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold transition-colors",
                      likedComments.has(comment.id) ? "text-[#800020]" : "text-muted-foreground hover:text-[#800020]"
                    )}
                  >
                    <ThumbsUp className={cn("h-3.5 w-3.5", likedComments.has(comment.id) && "fill-current")} />
                    <span>좋아요 {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
    </div >
  )
}