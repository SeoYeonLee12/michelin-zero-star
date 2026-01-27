import { apiFetch } from "./client" // 너 파일 구조에 맞춰 이미 쓰는 경로 유지

export type MeResponse = {
  id: string
  name: string
  nickname: string
  email: string
  profileImage?: string
  level?: string
  bio?: string
  location?: string
  latitude?: number
  longitude?: number
  locationCode?: string
  stars?: number
  todayStars?: number
  lastStarDate?: string
}

export function getMe(accessToken: string) {
  return apiFetch<MeResponse>("/api/v1/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

/** ✅ 추가: 위치 인증/저장 */
export type VerifyLocationRequest = { latitude: number; longitude: number }

// 백엔드가 "문자열"만 줄 수도 있고, 프론트 mock처럼 객체를 줄 수도 있어서 둘 다 받게 해둠
export type VerifyLocationResponse =
  | string
  | {
      message: string
      locationAddress?: string
      locationCode?: string
    }

export function verifyLocation(body: VerifyLocationRequest, accessToken: string) {
  return apiFetch<VerifyLocationResponse>("/api/v1/users/location", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
}