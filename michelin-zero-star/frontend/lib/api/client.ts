// client.ts

type ApiErrorPayload = {
  message?: string
  error?: string
  status?: number
}

function tryParseJson(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null

  // content-type이 없거나 이상해도, 바디가 JSON 모양이면 파싱 시도
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

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  const contentType = res.headers.get("content-type") || ""
  const raw = await res.text()

  const isJsonHeader = contentType.includes("application/json")
  const parsed = isJsonHeader ? (raw ? tryParseJson(raw) : null) : tryParseJson(raw)

  // 실패 응답 처리
  if (!res.ok) {
    // JSON이면 message 추출, 아니면 raw 그대로
    const payload = (parsed ?? {}) as ApiErrorPayload
    const message =
      payload.message ||
      payload.error ||
      (typeof parsed === "string" ? parsed : "") ||
      raw ||
      `Request failed (${res.status})`

    throw new Error(message)
  }

  // 성공 응답 처리
  // JSON이면 JSON 반환, 아니면 문자열(raw) 반환
  return (parsed ?? (raw as unknown)) as T
}