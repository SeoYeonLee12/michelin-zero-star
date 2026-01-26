/**
 * API 클라이언트
 * 백엔드와의 모든 HTTP 통신을 담당합니다.
 */

import type { LocationRequestDto, LocationResponseDto } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * API 요청을 보내는 기본 함수
 * Authorization 헤더에 토큰을 자동으로 포함합니다.
 */
async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
  token?: string,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Authorization 토큰이 있으면 헤더에 추가
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // 상태 코드 확인
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.message || `HTTP ${response.status}`
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    ;(error as any).data = errorData
    throw error
  }

  // 응답이 있으면 JSON으로 파싱
  const contentType = response.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    return response.json()
  }

  // 204 No Content 같은 경우
  return null as T
}

/**
 * 위치 정보 인증 API
 * POST /api/v1/users/location
 * 
 * 주의: 프론트에서는 입력받은 좌표를 고정된 좌표로 변환합니다.
 * 배포 시에도 동일한 좌표를 사용합니다.
 */
const FIXED_LATITUDE = 36.3549777
const FIXED_LONGITUDE = 127.2983403

export async function verifyUserLocation(
  locationData: LocationRequestDto,
  token: string,
): Promise<LocationResponseDto> {
  try {
    // 🔧 입력받은 좌표를 무시하고 고정 좌표로 변환
    const fixedLocationData: LocationRequestDto = {
      latitude: FIXED_LATITUDE,
      longitude: FIXED_LONGITUDE,
    }

    // console.log("🔌 실제 백엔드 API 호출:")
    // console.log(`   입력 좌표: (${locationData.latitude}, ${locationData.longitude})`)
    // console.log(`   전송 좌표: (${fixedLocationData.latitude}, ${fixedLocationData.longitude})`)

    const response = await apiRequest<LocationResponseDto>(
      "/users/location",
      {
        method: "POST",
        body: JSON.stringify(fixedLocationData),
      },
      token,
    )
    return response
  } catch (error) {
    console.error("위치 인증 실패:", error)
    throw error
  }
}

/**
 * 사용자 정보 업데이트 API (프로필 수정)
 * PATCH /api/v1/users/profile
 */
export async function updateUserProfile(
  profileData: Record<string, unknown>,
  token: string,
): Promise<any> {
  try {
    const response = await apiRequest(
      "/users/profile",
      {
        method: "PATCH",
        body: JSON.stringify(profileData),
      },
      token,
    )
    return response
  } catch (error) {
    console.error("프로필 업데이트 실패:", error)
    throw error
  }
}

/**
 * 로그인 API
 * POST /api/v1/auth/login
 */
export async function login(email: string, password: string): Promise<{ accessToken: string }> {
  try {
    const response = await apiRequest<{ accessToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    )
    return response
  } catch (error) {
    console.error("로그인 실패:", error)
    throw error
  }
}

/**
 * 회원가입 API
 * POST /api/v1/auth/signup
 */
export async function signup(data: {
  name: string
  nickname: string
  email: string
  password: string
}): Promise<{ accessToken: string }> {
  try {
    const response = await apiRequest<{ accessToken: string }>(
      "/auth/signup",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    )
    return response
  } catch (error) {
    console.error("회원가입 실패:", error)
    throw error
  }
}
