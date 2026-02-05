// frontend/lib/voice-intent.ts

export type VoiceIntent =
  | { type: "WAKE" }
  | { type: "CLOSE_CHAT" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "CHAT"; text: string }
  | { type: "NONE" }

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()

export function parseVoiceIntent(rawText: string, aiOpen: boolean): VoiceIntent {
  const t = normalize(rawText)
  if (!t) return { type: "NONE" }

  // 채팅 종료 (유사어)
  if (/(채팅|챗봇|셰프)?\s*(닫아|닫기|종료|끝|그만|나가|꺼)/.test(t)) {
    return { type: "CLOSE_CHAT" }
  }

  // WAKE (셰프님)
  if (/(셰프(님)?|챗봇|ai야|)/.test(t)) {
    return { type: "WAKE" }
  }

  // NEXT (유사어)
  if (/(다음(으로)?|다음 단계(로)?|넘겨|넘어가|다음 가)/.test(t)) {
    return { type: "NEXT" }
  }

  // PREV (유사어)
  if (/(이전(으로)?|전 단계|뒤로|돌아가)/.test(t)) {
    return { type: "PREV" }
  }

  // PAUSE (유사어)
  if (/(일시\s*정지|정지|멈춰|스톱|pause)/.test(t)) {
    return { type: "PAUSE" }
  }

  // PLAY (유사어)
  if (/(시작|재생|이어(서)?\s*(해|하기)|계속(해|하기)|play)/.test(t)) {
    return { type: "PLAY" }
  }

  // 그 외는 채팅이 열려있을 때만 질문으로 처리
  if (aiOpen) return { type: "CHAT", text: rawText.trim() }
  return { type: "NONE" }
}

