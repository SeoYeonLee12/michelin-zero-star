import { apiFetch } from "./client"

export type MeResponse = {
  id: string
  name: string
  nickname: string
  email: string
  profileImageUrl?: string // ✅ Renamed from profileImage
  level?: string
  bio?: string
  location?: string
  latitude?: number
  longitude?: number
  locationCode?: string
  stars?: number
  totalStar?: number // ✅ 추가
  todayStars?: number
  lastStarDate?: string
}

export function getMe() {
  return apiFetch<MeResponse>("/api/v1/users/me", {
    method: "GET",
  })
}

export type VerifyLocationRequest = { latitude: number; longitude: number }

export type VerifyLocationResponse =
  | string
  | {
    message: string
    locationAddress?: string
    locationCode?: string
  }

export function verifyLocation(body: VerifyLocationRequest) {
  return apiFetch<VerifyLocationResponse>("/api/v1/users/location", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

// ✅ 추가: 유저 정보 수정 Request DTO
export type UpdateProfileRequest = {
  nickname?: string
  profileImageUrl?: string // ✅ 백엔드 DTO와 일치 (profileImage -> profileImageUrl)
  categories?: string[]
  currentPassword?: string
  newPassword?: string
  newPasswordConfirm?: string
}

// ✅ 추가: 유저 정보 수정 API
export function updateProfile(body: UpdateProfileRequest) {
  return apiFetch<string>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

// ✅ 내가 찜한 마켓 게시글 조회
export interface MarketPostListItem {
  id: number
  title: string
  price: number
  location: string
  thumbnailUrl?: string
  status: string
  chatCount: number
}

export function getMyLikedPosts() {
  return apiFetch<MarketPostListItem[]>("/api/v1/users/me/likes", {
    method: "GET",
  })
}

// ✅ 추가: 회원 탈퇴 API
export function withdrawUser() {
  return apiFetch<string>("/api/v1/users/me", {
    method: "DELETE",
  })
}