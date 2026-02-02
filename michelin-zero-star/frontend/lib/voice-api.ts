// frontend/lib/voice-api.ts
const AI_BASE = "http://127.0.0.1:8000"

export type SpeechTokenResponse = {
  token: string
  region: string
}

export async function fetchSpeechToken(): Promise<SpeechTokenResponse> {
  const res = await fetch(`${AI_BASE}/api/speech/token`)
  if (!res.ok) throw new Error(`speech token failed: ${res.status}`)
  return res.json()
}

export type ChatRequest = { text: string }
export type ChatResponse = { answer: string }

export async function postChat(body: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${AI_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`chat failed: ${res.status}`)
  return res.json()
}
