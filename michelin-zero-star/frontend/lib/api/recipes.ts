import { apiFetch } from "./client"

// 백엔드 명세에 맞춘 응답 데이터 타입 정의
export interface BackendRecipeResponse {
  recipeId: number
  userId: number
  title: string
  mainImageUrl: string
  description: string
  cookTime: number
  servings: number
  scrapCount: number
  reviewCount: number
  averageRating: number
  recipeType: string
  calorie: number
  carbohydrate: number
  protein: number
  saturatedFat: number
  cholesterol: number
  sodium: number
  calcium: number
  createdAt: string
  updatedAt: string
  nickname: string
  isScrapped: boolean
  isMine: boolean
  categoryNames: string[]
  tags: {
    tag_name: string
  }[]
  ingredients: {
    ingredient_name: string
    ingredient_amount: string
  }[]
  steps: {
    step_number: number
    step_description: string
    timer_seconds: number
    step_imageUrl: string | null
    cooking_tip: string | null
  }[]
}

export interface RecipeListItem {
  recipeId: number
  title: string
  mainImageUrl: string
  averageRating: number
  isScrapped: boolean
  nickName: string
  isMine: boolean
  tags: { tag_name: string }[]
}

export interface RecipeListResponse {
  recipes: RecipeListItem[]
  pageInfo: {
    currentPage: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export type RecipeType = "USER" | "CHEF"
export type SortType = "LATEST" | "RATING" | "TIME"

export interface GetRecipeListParams {
  recipeType: RecipeType
  sort: SortType
  category?: string
  searchWord?: string
  page?: number
  size?: number
}

/**
 * 레시피 목록 조회 API
 * 백엔드 미구현으로 인해 Next.js Mock API(route.ts)를 호출합니다.
 */
// lib/api/recipes.ts

// ... (keep imports)

// ... (keep interface definitions until getRecipeList)

/**
 * 레시피 목록 조회 API
 * 백엔드 미구현으로 인해 Next.js Mock API(route.ts)를 호출합니다.
 */
export async function getRecipeList(params: GetRecipeListParams) {
  const query = new URLSearchParams()
  query.append("recipeType", params.recipeType)
  query.append("sort", params.sort)
  if (params.category) query.append("category", params.category)
  if (params.searchWord) query.append("searchWord", params.searchWord)
  if (params.page !== undefined) query.append("page", params.page.toString())
  if (params.size !== undefined) query.append("size", params.size.toString())

  const response = await fetch(`/api/recipes?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch recipes: ${response.status}`)
  }

  return response.json() as Promise<RecipeListResponse>
}

/**
 * 레시피 단일 조회 API
 * @param recipeId 레시피 ID (문자열 또는 숫자)
 */
export async function getRecipeDetail(recipeId: string) {
  // client.ts의 apiFetch가 자동으로 메모리 토큰을 사용하므로 별도 토큰 전달 불필요
  return apiFetch<BackendRecipeResponse>(`/api/recipes/${recipeId}`, {
    method: "GET",
  })
}

export interface RegisterRecipeRequest {
  title: string
  mainImageUrl: string
  recipeDescription: string
  cookTime: number
  servings: number
  calorie: number
  carbohydrate: number
  protein: number
  saturatedFat: number
  cholesterol: number
  sodium: number
  calcium: number
  categoryIds: number[]
  ingredients: {
    ingredientName: string
    ingredientAmount: string
  }[]
  tags: {
    tagName: string
  }[]
  steps: {
    stepNumber: number
    stepDescription: string
    timerSeconds: number
    stepImageUrl: string
    cookingTip: string | null
  }[]
}

export interface RegisterRecipeResponse {
  recipeId: number
  isAwardedRecipeRegisterReward: boolean
}

/**
 * 레시피 등록 API
 * @param data 등록할 레시피 정보
 */
export async function registerRecipe(data: RegisterRecipeRequest) {
  return apiFetch<RegisterRecipeResponse>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * 레시피 수정 API ("그대로" 요청 바디 사용, ID만 URL 파라미터)
 */
export async function updateRecipe(recipeId: string, data: RegisterRecipeRequest) {
  return apiFetch<RegisterRecipeResponse>(`/api/recipes/${recipeId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * 레시피 삭제 API
 */
export async function deleteRecipe(recipeId: string) {
  return apiFetch<void>(`/api/recipes/${recipeId}`, {
    method: "DELETE",
  })
}

export interface CookingModeStep {
  recipeStepId: number
  stepNumber: number
  stepDescription: string
  stepImageUrl: string
  timerSeconds: number
  cookingTip: string | null
}

export interface CookingModeResponse {
  recipeId: number
  title: string
  totalStep: number
  steps: CookingModeStep[]
}

/**
 * 요리 모드 데이터 조회 API
 */
export async function getCookingModeDetails(recipeId: string) {
  return apiFetch<CookingModeResponse>(`/api/recipes/${recipeId}/cooking`, {
    method: "GET",
  })
}

export interface CookingCompleteResponse {
  cookingLogId: number
  isAwardedCookingCompleteReward: boolean
}

/**
 * 요리 완료 API
 */
export async function completeCooking(recipeId: string) {
  return apiFetch<CookingCompleteResponse>("/api/cooking/complete", {
    method: "POST",
    body: JSON.stringify({ recipeId: Number(recipeId) }),
  })
}