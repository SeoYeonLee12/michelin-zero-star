// frontend/lib/stt.ts
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"

export type SttController = { stop: () => void }

type StartSttContinuousOpts = {

  token: string
  region: string

  language?: string

  onFinal: (text: string) => void

  onPartial?: (text: string) => void

  onError?: (err: any) => void
}

export function startSttContinuous(opts: StartSttContinuousOpts): SttController {
  const { token, region, language = "ko-KR", onFinal, onPartial, onError } = opts

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(token, region)
  speechConfig.speechRecognitionLanguage = language

  speechConfig.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
    "900",
  )

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)

  try {
    const phraseList = SpeechSDK.PhraseListGrammar.fromRecognizer(recognizer)
    ;[
      "셰프님",
      "챗봇",
      "다음",
      "다음으로",
      "다음 단계",
      "넘겨",
      "이전",
      "이전으로",
      "뒤로",
      "일시정지",
      "정지",
      "멈춰",
      "이어하기",
      "계속",
      "재생",
      "채팅 종료",
      "채팅 닫아",
      "닫기",
      "종료",
      "끝",
    ].forEach((p) => phraseList.addPhrase(p))
  } catch {
    // 무시
  }

  recognizer.recognizing = (_s, e) => {
    if (!onPartial) return
    if (e.result?.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
      const t = (e.result.text || "").trim()
      if (t) onPartial(t)
    }
  }

  recognizer.recognized = (_s, e) => {
    if (e.result?.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
      const t = (e.result.text || "").trim()
      if (t) onFinal(t)
    } else {
      // NoMatch 등도 올 수 있음
      // 필요하면 로그 찍고 싶으면 여기서 처리
    }
  }

  recognizer.canceled = (_s, e) => {
    onError?.(e)
  }

  recognizer.sessionStopped = (_s, e) => {
    onError?.(e)
  }

  recognizer.startContinuousRecognitionAsync(
    () => {},
    (err) => onError?.(err),
  )

  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    try {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          try { recognizer.close() } catch {}
        },
        () => {
          try { recognizer.close() } catch {}
        },
      )
    } catch {
      try { recognizer.close() } catch {}
    }
  }

  return { stop }
}

