import { WebVoiceProcessor } from "@picovoice/web-voice-processor"
import { PorcupineWorker } from "@picovoice/porcupine-web"

export type KwsCommand = "WAKE" | "NEXT" | "PREV" | "PLAY" | "PAUSE"

export type PorcupineController = {
  start: () => Promise<void>
  stop: () => Promise<void>
}

export function createPorcupineController(opts: {
  accessKey: string
  modelPublicPath: string
  keywords: Array<{ label: KwsCommand; publicPath: string }>
  onCommand: (cmd: KwsCommand) => void
}): PorcupineController {
  const { accessKey, modelPublicPath, keywords, onCommand } = opts

  let porcupine: PorcupineWorker | null = null
  let started = false

  // ✅ stop 중복 호출/동시 실행 방지
  let stoppingPromise: Promise<void> | null = null

  async function start() {
    if (started) return
    started = true

    // 만약 stop이 진행 중이면, stop이 끝난 뒤에 start가 실행되도록 보장
    if (stoppingPromise) {
      await stoppingPromise
    }

    const keywordDetectionCallback = (detection: any) => {
      onCommand(detection.label as KwsCommand)
    }

    porcupine = await PorcupineWorker.create(
      accessKey,
      keywords.map((k) => ({ publicPath: k.publicPath, label: k.label })),
      keywordDetectionCallback,
      { publicPath: modelPublicPath },
      {},
    )

    await WebVoiceProcessor.subscribe(porcupine)
  }

  async function stop() {
    if (!started && !porcupine) return

    // ✅ 이미 stop 진행 중이면 그거 기다리기
    if (stoppingPromise) return stoppingPromise

    started = false

    // ✅ 레퍼런스 고정 + await 전에 null 처리 (race 차단)
    const p = porcupine
    porcupine = null

    if (!p) return

    stoppingPromise = (async () => {
      try {
        await WebVoiceProcessor.unsubscribe(p)
      } catch (e) {
        // 이미 해제된 상태거나 중복 unsubscribe일 수 있어서 안전하게 무시
        // (원하면 console.warn 가능)
      } finally {
        try {
          ;(p as any).release?.()
        } catch {}
        try {
          ;(p as any).terminate?.()
        } catch {}
        stoppingPromise = null
      }
    })()

    return stoppingPromise
  }

  return { start, stop }
}
