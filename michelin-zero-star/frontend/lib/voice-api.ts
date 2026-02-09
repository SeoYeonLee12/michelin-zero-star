// frontend/lib/voice-api.ts

export type SpeechTokenResponse = {
  token: string
  region: string
  mode: "subscription" | "authorizationToken"
}

export async function fetchSpeechToken(): Promise<SpeechTokenResponse> {
    const token = process.env.NEXT_PUBLIC_SPEECH_KEY
    const region = process.env.NEXT_PUBLIC_SPEECH_REGION

    if (!token || !region) {
	throw new Error("Missing KEY or REGION")
    }
    return { token, region, mode: "subscription" }
    
}

export type ChatRequest = { text: string }
export type ChatResponse = { answer: string }

export async function postChat(body: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`chat failed: ${res.status}`)
  return res.json()
}

