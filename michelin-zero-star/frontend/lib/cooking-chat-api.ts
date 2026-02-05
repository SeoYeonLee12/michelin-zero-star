// frontend/lib/cooking-chat-api.ts
import { apiFetch } from "@/lib/api/client"

export async function postCookingChat(params: {
  recipeId: number
  currentStepIndex: number
  message: string
}): Promise<{ answer: string }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"

  // POST /api/v1/recipes/...? (legacy??)
  // The user prompt only mentioned WebSocket for sending messages.
  // However, `postCookingChat` was used in the previous code.
  // If we move to WebSocket only for new messages, this might be unused or fallback.
  // I will keep it as is or update if needed, but the prompt focused on history and WS.
  // Let's keep it for now but maybe I don't need to change IT, just ADD the new one.

  const res = await fetch(`${base}/api/v1/recipes/${params.recipeId}/cooking/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export type ChatHistoryResponse = {
  aiChatHistories: Array<{
    aiChatMessageId: number
    content: string
    senderType: "USER" | "AI"
    sendDate: string
  }>
  nextCursorId: number
  hasNext: boolean
}

export async function fetchCookingChatHistory(
  recipeId: number,
  lastMessageId?: number,
  pageSize: number = 20
): Promise<ChatHistoryResponse> {
  const query = new URLSearchParams()
  if (lastMessageId) query.append("lastMessageId", lastMessageId.toString())
  if (pageSize) query.append("pageSize", pageSize.toString())

  // Use apiFetch to handle base URL and auth tokens automatically
  return apiFetch<ChatHistoryResponse>(`/api/recipes/${recipeId}/chat?${query.toString()}`, {
    method: "GET",
  })
}
