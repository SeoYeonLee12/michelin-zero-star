// client.ts
import { getCookie } from "../cookie"

type ApiErrorPayload = {
  message?: string
  error?: string
  status?: number
}

// ✅ 메모리 내 액세스 토큰 (브라우저 새로고침 시 초기화됨 -> Silent Refresh로 복구 필요)
let memoryAccessToken: string | null = null

export function setGlobalAccessToken(token: string | null) {
  memoryAccessToken = token
}

export function getGlobalAccessToken() {
  return memoryAccessToken
}

function tryParseJson(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null

  const looksLikeJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))

  if (!looksLikeJson) return null

  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

/**
 * 상대경로("/api/v1/...")로 호출해도 백엔드로 보내기 위한 base URL
 */
function resolveUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  const base = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!base) return url

  if (url.startsWith("/")) return `${base}${url}`
  return `${base}/${url}`
}

// Interceptor 무한 루프 방지용 옵션 추가
export interface ApiFetchOptions extends RequestInit {
  skipAuthRefresh?: boolean
}

export async function apiFetch<T = unknown>(
  url: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuthRefresh, ...fetchOptions } = options
  const token = memoryAccessToken

  const headers = new Headers(fetchOptions.headers || {})

  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  // ✅ 메모리 토큰이 있으면 Authorization 헤더 추가
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(resolveUrl(url), {
    ...fetchOptions,
    headers,
    credentials: "include", // ✅ 쿠키 전송 보장
  })

  // ✅ 401 발생 시 토큰 갱신 시도 (skipAuthRefresh가 아닐 때만)
  if (res.status === 401 && !skipAuthRefresh) {
    try {
      console.log("[apiFetch] 401 detected. Attempting Silent Refresh...")

      // 리프레시 토큰은 쿠키(HttpOnly)에 있으므로, Credentials를 포함해서 요청해야 함 (브라우저 기본 동작)
      // 단, Next.js Rewrite를 통하지 않고 직접 백엔드를 찌를 때는 credentials: 'include' 필요할 수 있음
      // 현재 구조상 Proxy나 Rewrite를 쓴다면 쿠키가 자동으로 감.
      // 여기서는 `fetch`를 직접 사용하여 순환 참조 회피
      const refreshRes = await fetch(resolveUrl("/api/v1/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ 쿠키 전송 보장
      })

      if (refreshRes.ok) {
        const data = await refreshRes.json()
        const newAccessToken = data.accessToken

        console.log("[apiFetch] Silent Refresh Success. Retrying original request.")
        setGlobalAccessToken(newAccessToken)

        // 새 토큰으로 재시도
        const newHeaders = new Headers(fetchOptions.headers || {})
        newHeaders.set("Authorization", `Bearer ${newAccessToken}`)

        return apiFetch<T>(url, {
          ...options,
          headers: newHeaders,
          skipAuthRefresh: true // 재시도 시에는 또 갱신하지 않음
        })
      } else {
        console.error("[apiFetch] Refresh Failed. User might need to login again.")
        // 리프레시 실패 시 로그아웃 처리 등을 할 수도 있음
        setGlobalAccessToken(null)
      }
    } catch (refreshError) {
      console.error("[apiFetch] Error during token refresh:", refreshError)
    }
  }

  const contentType = res.headers.get("content-type") || ""
  const raw = await res.text()

  const isJsonHeader = contentType.includes("application/json")
  const parsed = isJsonHeader ? (raw ? tryParseJson(raw) : null) : tryParseJson(raw)

  if (!res.ok) {
    const payload = (parsed ?? {}) as ApiErrorPayload
    const message =
      payload.message ||
      payload.error ||
      (typeof parsed === "string" ? parsed : "") ||
      raw ||
      `Request failed (${res.status})`

    throw new Error(message)
  }

  return (parsed ?? (raw as unknown)) as T
}