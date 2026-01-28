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
  calorie?: number
  categoryNames: string[]
  tags: { tag_name: string }[]
  ingredients: { 
    ingredient_name: string; 
    ingredient_amount: string 
  }[]
  steps: {
    step_number: number
    step_description: string
    timer_seconds: number
    step_imageUrl: string
    cooking_tip: string | null
  }[]
}

/**
 * 레시피 단일 조회 API
 * @param recipeId 레시피 ID (문자열 또는 숫자)
 * @param token 선택적 인증 토큰 (팀원이 작업 중인 auth 로직과 연동 예정)
 */
export async function getRecipeDetail(recipeId: string, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // [핵심 수정] 토큰이 실제로 존재하고 유효한 문자열일 때만 헤더에 추가
  // 이렇게 하면 비로그인 상태에서 'undefined' 같은 문자열이 서버로 전송되는 것을 방지합니다.
  if (token && token.trim() !== "" && token !== "undefined") {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`
  }

  // API 엔드포인트 호출
  // client.ts의 apiFetch를 사용하므로 공통 에러 처리가 적용됩니다.
  return apiFetch<BackendRecipeResponse>(`/api/recipes/${recipeId}`, {
    method: "GET",
    headers,
  })
}