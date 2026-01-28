import { apiFetch } from "./client"

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