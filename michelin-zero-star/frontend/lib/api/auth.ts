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
grantType: string
accessToken: string
refreshToken: string
accessTokenExpiresIn: number
}


export function login(body: LoginRequest) {
return apiFetch<LoginResponse>("/api/v1/auth/login", {
method: "POST",
body: JSON.stringify(body),
})
}