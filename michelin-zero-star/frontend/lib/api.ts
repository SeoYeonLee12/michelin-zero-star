// lib/api.ts
import type { LocationRequestDto, LocationResponseDto } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>
}

async function apiRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
    token?: string,
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }

  // 응답 본문이 없는 경우 (204 등) 처리
  const text = await response.text()
  return text ? JSON.parse(text) : ({} as T)
}

// --- API Functions ---

// 위치 인증 (실제 좌표 전송)
export async function verifyUserLocation(
    locationData: LocationRequestDto,
    token: string,
): Promise<LocationResponseDto> {
  return apiRequest<LocationResponseDto>(
      "/users/location",
      {
        method: "POST",
        body: JSON.stringify(locationData), // ✅ 실제 좌표 전송
      },
      token,
  )
}

// 프로필 수정
export async function updateUserProfile(
    profileData: Record<string, unknown>,
    token: string,
): Promise<any> {
  return apiRequest(
      "/users/profile",
      {
        method: "PATCH",
        body: JSON.stringify(profileData),
      },
      token,
  )
}

// 로그인
export async function login(email: string, password: string): Promise<{ accessToken: string }> {
  return apiRequest<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// 회원가입
export async function signup(data: {
  name: string
  nickname: string
  email: string
  password: string
}): Promise<string> {
  return apiRequest<string>("/auth/join", {
    method: "POST",
    body: JSON.stringify(data),
  })
}