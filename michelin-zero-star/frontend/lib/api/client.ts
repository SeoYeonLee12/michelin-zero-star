// client.ts

type ApiErrorPayload = {
  message?: string
  error?: string
  status?: number
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

/** 브라우저에서만 접근 가능 */
// client.ts
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  // ✅ cooksync 키로 통일
  return (
    localStorage.getItem("cooksync_access_token") ||
    localStorage.getItem("accessToken") // (혹시 예전 키 남아있을 때 fallback)
  )
}
/**
 * 상대경로("/api/v1/...")로 호출해도 백엔드로 보내기 위한 base URL
 * - Docker에서도 브라우저 기준 주소여야 하므로 보통 http://localhost:8080
 */
function resolveUrl(url: string): string {
  // 이미 절대 URL이면 그대로 사용
  if (/^https?:\/\//i.test(url)) return url

  const base = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!base) return url // base가 없으면 기존 동작 유지(상대경로 그대로)

  // url이 "/..." 형태면 base + url, 아니면 base + "/" + url
  if (url.startsWith("/")) return `${base}${url}`
  return `${base}/${url}`
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken()

  // 헤더 병합 (options.headers가 Headers일 수도 있어서 안전하게 처리)
  const headers = new Headers(options.headers || {})
  // Content-Type은 body가 있을 때만 기본 세팅 (GET에도 붙어도 큰 문제는 없지만 깔끔하게)
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  // ✅ accessToken 있으면 Authorization 자동 첨부
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(resolveUrl(url), {
    ...options,
    headers,
  })

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