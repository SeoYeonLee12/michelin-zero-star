// frontend/lib/cooking-chat-api.ts
export async function postCookingChat(params: {
  recipeId: number
  currentStepIndex: number
  message: string
}): Promise<{ answer: string }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"

  const res = await fetch(`${base}/api/v1/recipes/${params.recipeId}/cooking/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // 로그인 세션 기반이면 아래 유지(쿠키 전달)
    credentials: "include",
    body: JSON.stringify({
      currentStepIndex: params.currentStepIndex,
      message: params.message,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}
