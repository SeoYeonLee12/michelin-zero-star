"use client"

import type React from "react"
import { RecipeCard } from "@/components/cook-sync/recipe-card"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { ScrollToTop } from "@/components/cook-sync/scroll-to-top"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, Plus, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
// API Import
import { getRecipeList, type RecipeListItem, type SortType, type RecipeType } from "@/lib/api/recipes"

const foodCategories = [
  { id: "rice", name: "밥", icon: "🍚" },
  { id: "side", name: "반찬", icon: "🥗" },
  { id: "soup", name: "국물", icon: "🍲" },
  { id: "noodle", name: "면", icon: "🍜" },
  { id: "dessert", name: "디저트", icon: "🍰" },
  { id: "snack", name: "분식", icon: "🍢" },
  { id: "salad", name: "샐러드", icon: "🥬" },
  { id: "drink", name: "음료", icon: "🥤" },
  { id: "nightsnack", name: "야식&술안주", icon: "🍻" },
  { id: "etc", name: "기타", icon: "🍽️" },
]

const ITEMS_PER_PAGE = 20

export default function RecipesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터 읽기
  const typeParam = searchParams.get("type") // 기존 Sidebar 연동용
  const recipeTypeParam = searchParams.get("recipeType") as RecipeType | null

  // recipeType 결정: URL 파라미터가 없으면 'type' 파라미터 참고, 그것도 없으면 기본값
  // 레시피 연구소(type=user) -> USER
  // 레시피 도서관(type=library 등 또는 기본) -> CHEF
  // User 요청: "/recipes?recipeType=CHEF..."
  const currentRecipeType: RecipeType = recipeTypeParam
    ? recipeTypeParam
    : (typeParam === "user" ? "USER" : "CHEF")

  const isUserRecipePage = currentRecipeType === "USER"

  const categoryParam = searchParams.get("category")
  const searchWordParam = searchParams.get("searchWord")
  const sortParam = searchParams.get("sort") as "LATEST" | "RATING" | "TIME" || "LATEST"
  const pageParam = parseInt(searchParams.get("page") || "1", 10)

  // 검색어 입력 상태는 타이핑 중을 위해 로컬 유지
  const [searchInput, setSearchInput] = useState(searchWordParam || "")
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const { isLoggedIn, toggleLikeRecipe, isRecipeLiked } = useAuth()

  // API 데이터 상태
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  // URL 업데이트 헬퍼
  const updateQuery = (newParams: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    // 기본적으로 recipeType 유지 (없으면 추가)
    if (!params.has("recipeType")) {
      params.set("recipeType", currentRecipeType)
    }

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    // 페이지 변경이 아닌 필터 변경 시에는 1페이지로 리셋하는 로직이 필요할 수 있음
    // 이 헬퍼를 호출하는 쪽에서 page: 1을 명시하면 됨

    router.push(`?${params.toString()}`)
  }

  // 데이터 가져오기
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await getRecipeList({
          recipeType: currentRecipeType,
          sort: sortParam, // Enum 문자열 그대로 전달 (LATEST, RATING, TIME)
          category: categoryParam || undefined,
          searchWord: searchWordParam || undefined,
          page: pageParam - 1, // ✅ 백엔드는 0-based (Spring Pageable 기본값)
          size: ITEMS_PER_PAGE,
        })

        setRecipes(response.recipes)
        setTotalPages(response.pageInfo.totalPages)
        setTotalElements(response.pageInfo.totalElements)
      } catch (error) {
        console.error("Failed to fetch recipes:", error)
        setRecipes([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentRecipeType, sortParam, categoryParam, searchWordParam, pageParam])

  // 검색어 입력 동기화 (URL 변경 시 입력창도 업데이트)
  useEffect(() => {
    setSearchInput(searchWordParam || "")
  }, [searchWordParam])

  const handleCategoryClick = (categoryName: string) => {
    // 같은 카테고리 클릭 시 해제
    const newCategory = categoryParam === categoryName ? null : categoryName
    updateQuery({ category: newCategory, page: 1 })
  }

  const handleSearch = () => {
    updateQuery({ searchWord: searchInput, page: 1 })
  }

  const handleSortChange = (value: string) => {
    // value: latest, rating, time (소문자) -> 대문자로 변환 필요? 
    // Select value가 소문자라면 변환, 대문자라면 그대로.
    // 기존 SelectItem value="latest" 등을 "LATEST"로 바꾸는게 편함.
    // 여기서는 매핑 사용.
    const upperValue = value.toUpperCase()
    updateQuery({ sort: upperValue, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    updateQuery({ page: newPage })
  }

  const handleHeartClick = (e: React.MouseEvent, recipe: RecipeListItem) => {
    e.preventDefault()
    e.stopPropagation()
    toggleLikeRecipe(String(recipe.recipeId))
  }

  // 페이지네이션 번호 생성
  const getPageNumbers = () => {
    const pages = []
    const range = 2 // 현재 페이지 양옆으로 보여줄 개수

    // 항상 1페이지는 포함
    // Logic: 1 ... (current-range) ~ (current+range) ... total
    // But for simplicity, just sliding window or all if small

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, pageParam - range)
      let end = Math.min(totalPages, pageParam + range)

      if (start <= 1) {
        start = 1
        end = Math.min(5, totalPages)
      }
      if (end >= totalPages) {
        end = totalPages
        start = Math.max(1, totalPages - 4)
      }

      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <ScrollToTop />
      <main className="flex-1 container mx-auto max-w-[1400px] px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-transparent select-none">
            {isUserRecipePage ? "레시피 연구소" : "레시피 도서관"}
          </h1>
        </div>


        {/* Search row + Register button (center-fixed) */}
        <div className="grid grid-cols-[1fr_minmax(0,700px)_1fr] items-center mb-4">
          {/* 왼쪽: 빈 공간(중앙 정렬 보정용) */}
          <div />

          {/* 가운데: 검색창 (항상 화면 중앙) */}
          <div className="relative w-full justify-self-center">
            <div className="flex items-center rounded-full border-2 border-[#800020] bg-background overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <Input
                placeholder="레시피 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch()
                }}
                className="flex-1 border-0 h-12 px-5 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-[#800020] hover:bg-[#800020]/90 mr-1"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {/* 오른쪽: 레시피 등록 버튼 */}
          <div className="justify-self-end">
            {isUserRecipePage && (
              <Button className="gap-2 bg-[#800020] hover:bg-[#800020]/90" onClick={() => {
                if (!isLoggedIn) {
                  setShowLoginDialog(true)
                } else {
                  router.push("/recipes/new")
                }
              }}>
                <Plus className="h-4 w-4" />
                레시피 등록
              </Button>
            )}
          </div>
        </div>


        <div className="mb-4">
          <div className="flex items-center justify-center gap-4 overflow-x-auto overflow-y-visible pb-2 scrollbar-hide">
            {foodCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                className={cn(
                  "flex flex-col items-center gap-2 min-w-[72px] p-3 rounded-xl transition-all",
                  categoryParam === category.name ? "bg-[#800020]/10 ring-inset ring-2 ring-[#800020]" : "hover:bg-muted",
                )}
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all",
                    categoryParam === category.name ? "bg-[#800020] shadow-lg scale-105" : "bg-muted",
                  )}
                >
                  {category.icon}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    categoryParam === category.name ? "text-[#800020]" : "text-muted-foreground",
                  )}
                >
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort Dropdown - Top Right */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            총 {totalElements}개의 레시피
            {categoryParam && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateQuery({ category: null, page: 1 })}
                className="ml-2 text-xs text-[#800020]"
              >
                필터 초기화
              </Button>
            )}
          </p>
          <Select
            value={sortParam}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={4}
              avoidCollisions={false}
            >
              <SelectItem value="LATEST">최신순</SelectItem>
              <SelectItem value="RATING">스타순</SelectItem>
              <SelectItem value="TIME">조리시간순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020]"></div>
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.recipeId}
                recipe={{
                  id: String(recipe.recipeId), // RecipeCard interface 호환
                  name: recipe.title,
                  thumbnail: recipe.mainImageUrl || "/placeholder.svg",
                  author: recipe.nickName,
                  rating: recipe.averageRating,
                  hashtags: recipe.tags.map(t => t.tag_name),
                  tags: [],
                  duration: 0,
                  servings: 0,
                  difficulty: "초보",
                  steps: [],
                  isUserRecipe: isUserRecipePage
                }}
                // showAuthor가 true면 카드에서 닉네임 표시 (RecipeCard 수정 필요)
                showAuthor={isUserRecipePage}
                isLiked={isRecipeLiked(String(recipe.recipeId)) || recipe.isScrapped}
                onHeartClick={(e) => handleHeartClick(e, recipe)}
                onClick={() => router.push(`/recipes/${recipe.recipeId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            <Button variant="link" className="text-[#800020] mt-2" onClick={() => {
              setSearchInput("")
              updateQuery({ searchWord: null, category: null, page: 1 })
            }}>
              전체 목록 보기
            </Button>
          </div>
        )}

        {/* Pagination */}
        {recipes.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(pageParam - 1, 1))}
              disabled={pageParam === 1}
              className={cn(
                "p-2 text-gray-400 transition-colors",
                pageParam === 1 ? "opacity-30 cursor-not-allowed" : "hover:text-gray-600",
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={cn(
                  "min-w-[40px] h-10 rounded-lg text-base font-medium transition-all",
                  pageParam === page
                    ? "border-2 border-[#800020] text-[#800020] bg-white"
                    : "text-gray-500 hover:bg-gray-100",
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(Math.min(pageParam + 1, totalPages))}
              disabled={pageParam === totalPages}
              className={cn(
                "p-2 text-gray-400 transition-colors",
                pageParam === totalPages ? "opacity-30 cursor-not-allowed" : "hover:text-gray-600",
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </main>

      {/* <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>로그인이 필요한 서비스입니다</DialogTitle>
            <DialogDescription>
              레시피를 등록하려면 로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              레시피 둘러보기
            </Button>
            <Button
              className="bg-[#800020] hover:bg-[#800020]/90"
              onClick={() => router.push("/login")}
            >
              로그인 하러가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
      {/* Modern Minimal Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[360px] p-6 border border-border/50 shadow-xl rounded-2xl gap-0">
          <DialogHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#800020]/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-[#800020]" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg font-semibold">
                  로그인이 필요합니다
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  로그인하고 미슐랭 스타를 획득해보세요!
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-10 bg-transparent hover:bg-muted/50 rounded-lg font-medium text-sm"
              onClick={() => setShowLoginDialog(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1 h-10 bg-[#800020] hover:bg-[#800020]/90 text-white font-medium rounded-lg text-sm"
              onClick={() => {
                setShowLoginDialog(false)
                router.push("/login")
              }}
            >
              로그인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
