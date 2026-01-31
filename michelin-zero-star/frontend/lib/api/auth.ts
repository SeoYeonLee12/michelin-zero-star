import { apiFetch } from "./client"

export type JoinRequest = {
  email: string
  password: string
  name: string
  nickname: string
}

export type JoinResponse = string

export function join(body: JoinRequest) {
  return apiFetch<JoinResponse>("/api/v1/auth/join", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

/** ✅ 추가: 서비스 로그인 */
export type LoginRequest = {
  email: string
  password: string
}


export type LoginResponse = {
  accessToken: string
}


export function login(body: LoginRequest) {
  return apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function signup(payload: {
  email: string
  password: string
  name: string
  nickname: string
}): Promise<string> {
  return apiFetch("/api/v1/auth/join", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ✅ 추가: 로그아웃
export function logout() {
  return apiFetch<string>("/api/v1/auth/logout", {
    method: "POST",
  })
}

// ✅ 추가: 토큰 갱신 (쿠키의 리프레시 토큰 사용)
export function refreshAccessToken() {
  return apiFetch<LoginResponse>("/api/v1/auth/reissue", {
    method: "POST",
  })
}