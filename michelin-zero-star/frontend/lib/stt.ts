import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"

export type SttController = { stop: () => void }

export async function startSttOnce(opts: {
  token: string
  region: string
  onFinal: (text: string) => void
  onError?: (err: any) => void
}): Promise<SttController> {
  const { token, region, onFinal, onError } = opts

 // const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region)
  //speechConfig.speechRecognitionLanguage = "ko-KR"

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(token, region)

  speechConfig.speechRecognitionLanguage = process.env.NEXT_PUBLIC_SPEECH_LANG || "ko-KR"

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)

  recognizer.recognizeOnceAsync(
    (result) => {
      if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) onFinal(result.text ?? "")
      else onError?.(result)
      recognizer.close()
    },
    (err) => {
      onError?.(err)
      recognizer.close()
    },
  )

    let stopped = false

    const stop = () => {
    if (stopped) return
    stopped = true
    try {
        recognizer.close()
    } catch (e) {
        // 이미 disposed면 무시
    }
    }

    return { stop }
}
