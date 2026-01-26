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