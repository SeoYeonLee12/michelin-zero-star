import { WebVoiceProcessor } from "@picovoice/web-voice-processor"
import { PorcupineWorker } from "@picovoice/porcupine-web"

export type KwsCommand = "WAKE" | "NEXT" | "PREV" | "PLAY" | "PAUSE"

export type PorcupineController = {
  start: () => Promise<void>
  stop: () => Promise<void>
}

export function createPorcupineController(opts: {
  accessKey: string
  modelPublicPath: string // 예: "/porcupine/porcupine_params_ko.pv"
  keywords: Array<{ label: KwsCommand; publicPath: string }> // 예: "/porcupine/wake.ppn"
  onCommand: (cmd: KwsCommand) => void
}): PorcupineController {
  const { accessKey, modelPublicPath, keywords, onCommand } = opts

  let porcupine: PorcupineWorker | null = null
  let started = false

  async function start() {
    if (started) return
    started = true

    // 키워드 감지 콜백
    const keywordDetectionCallback = (detection: any) => {
      // detection.label 이 우리가 준 label로 들어옴
      onCommand(detection.label as KwsCommand)
    }

    // Porcupine 생성: (AccessKey, [keywordModel], callback, porcupineModel, options)
    // 문서에 나온 signature 그대로 사용 :contentReference[oaicite:3]{index=3}
    porcupine = await PorcupineWorker.create(
      accessKey,
      keywords.map((k) => ({ publicPath: k.publicPath, label: k.label })),
      keywordDetectionCallback,
      { publicPath: modelPublicPath },
      {}
    )

    // WebVoiceProcessor에 엔진 구독 → 실제 마이크 입력 들어오기 시작 :contentReference[oaicite:4]{index=4}
    await WebVoiceProcessor.subscribe(porcupine)
  }

  async function stop() {
    if (!started) return
    started = false

    if (porcupine) {
      await WebVoiceProcessor.unsubscribe(porcupine)
      porcupine.release()
      porcupine.terminate()
      porcupine = null
    }
  }

  return { start, stop }
}
