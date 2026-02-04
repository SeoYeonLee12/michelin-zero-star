"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Client } from "@stomp/stompjs"
import { getGlobalAccessToken } from "@/lib/api/client"
import { completeCooking } from "@/lib/api/cook-mode"
import { useAuth } from "@/lib/auth-context"
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Timer,
  ChefHat,
  Lightbulb,
  Mic,
  MicOff,
  X,
  Plus,
  Send,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { RecipeStep } from "@/lib/types"
// import { fetchSpeechToken, postChat } from "@/lib/voice-api"
import { fetchSpeechToken } from "@/lib/voice-api"
import { postCookingChat } from "@/lib/cooking-chat-api"
import { startSttOnce } from "@/lib/stt"
import { createPorcupineController } from "@/lib/kws/porcupine"

type SkillLevel = "beginner" | "intermediate" | "expert"

// WaveText 애니메이션 컴포넌트
function WaveText({ text }: { text: string }) {
  return (
    <span className="inline-flex">
      {text.split("").map((char, i) => (
        <span key={i} className="animate-wave-char" style={{ animationDelay: `${i * 0.1}s` }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  )
}

// 숙련도별 시간 조정 함수
const getAdjustedDuration = (baseDuration: number, level: SkillLevel) => {
  switch (level) {
    case "expert":
      return Math.round(baseDuration * 0.75)
    case "beginner":
      return Math.round(baseDuration * 1.25)
    default:
      return baseDuration
  }
}

export function StepCookMode({
  recipeId,
  steps,
  currentStepIndex,
  onStepChange,
  onComplete,
  recipeName,
  onBack,
}: {
  recipeId: number
  steps: RecipeStep[]
  currentStepIndex: number
  onStepChange: (index: number) => void
  onComplete: () => void
  recipeName?: string
  onBack?: () => void
}) {
  const router = useRouter()
  const { user } = useAuth()

  // ===== State 관리 =====
  const [skillLevel, setSkillLevel] = React.useState<SkillLevel>("intermediate")
  const [timerSeconds, setTimerSeconds] = React.useState(0)
  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set())
  const [autoAdvance, setAutoAdvance] = React.useState(true)

  // ✅ 음성 제어(마이크/KWS 켜기) 상태
  const [isListening, setIsListening] = React.useState(false)
  const [micPermission, setMicPermission] = React.useState<"unknown" | "granted" | "denied">("unknown")

  // ✅ AI 플로팅 관련
  const [aiOpen, setAiOpen] = React.useState(false)
  const [aiInput, setAiInput] = React.useState("")
  const [aiMessages, setAiMessages] = React.useState<Array<{ role: "user" | "ai"; content: string }>>([
    { role: "ai", content: "요리 중 궁금한 걸 말씀해 주세요. (예: '다음 단계 요약해줘')" },
  ])
  const aiEndRef = React.useRef<HTMLDivElement>(null)

  const pendingAdvanceRef = React.useRef(false)
  const prevStepRef = React.useRef(currentStepIndex)
  const prevSkillLevelRef = React.useRef(skillLevel)


  const currentStep = steps[currentStepIndex] || steps[0] // Safety: fallback to first step
  const totalProgress = ((currentStepIndex + 1) / steps.length) * 100
  const adjustedDuration = currentStep ? getAdjustedDuration(currentStep.duration, skillLevel) : 60


  // ====== refs (클로저 버그 방지: NEXT/PREV/PLAY 등) ======
  const sttStopRef = React.useRef<null | (() => void)>(null)
  const stompClientRef = React.useRef<Client | null>(null) // ✅ WebSocket Ref
  const porcupineRef = React.useRef<ReturnType<typeof createPorcupineController> | null>(null)

  const isListeningRef = React.useRef(isListening)
  const aiOpenRef = React.useRef(aiOpen)
  const stepIndexRef = React.useRef(currentStepIndex)
  const timerSecondsRef = React.useRef(timerSeconds)
  const isTimerRunningRef = React.useRef(isTimerRunning)
  const sttRetryTimerRef = React.useRef<number | null>(null)
  const aiToggleLockRef = React.useRef(false)

  const [aiVoiceEnabled, setAiVoiceEnabled] = React.useState(false)
  const [aiTurn, setAiTurn] = React.useState<"listening" | "thinking">("listening")

  const aiVoiceEnabledRef = React.useRef(aiVoiceEnabled)
  const aiTurnRef = React.useRef(aiTurn)
  const shuttingDownRef = React.useRef(false)

  React.useEffect(() => { aiVoiceEnabledRef.current = aiVoiceEnabled }, [aiVoiceEnabled])
  React.useEffect(() => { aiTurnRef.current = aiTurn }, [aiTurn])

  // ===== WebSocket Connection =====
  React.useEffect(() => {
    const token = getGlobalAccessToken()
    if (!token) return

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws/connect",
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      debug: (str) => console.log("[STOMP]", str),
    })

    client.onConnect = (frame) => {
      console.log("✅ WebSocket Connected")

      // AI 응답 구독
      client.subscribe("/user/queue/ai/reply", (message) => {
        if (message.body) {
          try {
            const body = JSON.parse(message.body)
            const answer = body.answer || body.content || body.message || message.body
            setAiMessages((prev) => [...prev, { role: "ai", content: answer }])

            // 응답이 오면 다시 듣기 모드 (지연 후)
            setTimeout(() => {
              setAiTurnSafe("listening")
              if (aiOpenRef.current && aiVoiceEnabledRef.current) {
                // scheduleSttRetry(50) // 루프 가능성 있으므로 상황 봐서
              }
            }, 500)

          } catch (e) {
            console.error("Msg Parse Error", e)
            setAiMessages((prev) => [...prev, { role: "ai", content: message.body }])
            setAiTurnSafe("listening")
          }
        }
      })
    }

    client.onStompError = (frame) => {
      console.error("Broker error: " + frame.headers["message"])
    }

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [user?.id])

  React.useEffect(() => { isListeningRef.current = isListening }, [isListening])
  React.useEffect(() => { aiOpenRef.current = aiOpen }, [aiOpen])
  React.useEffect(() => { stepIndexRef.current = currentStepIndex }, [currentStepIndex])
  React.useEffect(() => { timerSecondsRef.current = timerSeconds }, [timerSeconds])
  React.useEffect(() => { isTimerRunningRef.current = isTimerRunning }, [isTimerRunning])

  const safeStopStt = React.useCallback(() => {
    try { sttStopRef.current?.() } catch { }
    sttStopRef.current = null
  }, [])

  // ===== X 버튼 클릭 핸들러(페이지 닫기) =====
  const handleClose = () => {
    // 페이지 떠날 때 리소스 정리
    clearSttRetryTimer()
    safeStopStt()
    porcupineRef.current?.stop()
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }


  React.useEffect(() => {
    const check = async () => {
      try {
        // ✅ Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            // Stop the stream immediately, we just needed permission
            stream.getTracks().forEach(track => track.stop())
            setMicPermission("granted")
            setIsListening(true)
          })
          .catch((e) => {
            console.error("[getUserMedia@mount] failed:", e?.name, e?.message, e)
            setMicPermission("denied")
          })
      } catch {
        setMicPermission("unknown")
      }
    }
    check()
  }, [])

  // ===== AI 메시지 자동 스크롤 =====
  React.useEffect(() => {
    if (!aiOpen) return
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [aiMessages, aiOpen])

  // ====== 스텝 이동(클로저 안전) ======
  const goNextStep = React.useCallback(async () => {
    const idx = stepIndexRef.current
    setCompletedSteps(prev => new Set([...prev, idx]))


    // 마지막 스텝이면 요리 완료 API 요청 후 onComplete
    if (idx < steps.length - 1) {
      onStepChange(idx + 1)
    } else {
      clearSttRetryTimer()
      safeStopStt()
      setAiOpenSafe(false)
      setAiVoiceEnabled(false)
      setIsListening(false)
      await porcupineRef.current?.stop()

      try {
        await completeCooking({ recipeId })
        // 성공 시 onComplete (상위 컴포넌트에서 완료 페이지로 이동 or 모달 띄우기 등 처리)
        onComplete()
      } catch (err) {
        console.error("요리 완료 API 오류:", err)
        // 에러가 나도 완료 처리를 할지, 아니면 사용자에게 알릴지는 기획에 따라 다름.
        // 일단은 에러 로그만 찍고 완료 처리는 진행하도록(또는 막을 수도 있음) 함.
        // 여기서는 "에러 발생 시에도 일단 진행" or "Alert" 중 선택.
        // 유저 요청: "연결해줘" -> 실패하면 안 넘어가는 게 맞지만, UX상 일단 로그 찍고 넘어가는 게 나을 수도 있음.
        // 안전하게 여기서도 onComplete 호출.
        onComplete()
      }
    }
  }, [steps.length, onStepChange, onComplete, safeStopStt, recipeId])

  const goPrevStep = React.useCallback(() => {
    const idx = stepIndexRef.current
    if (idx > 0) onStepChange(idx - 1)
  }, [onStepChange])

  const handleStartTimer = React.useCallback(() => {
    if (isTimerRunningRef.current) return

    // 남아있는 시간이 있으면(일시정지 상태) 그대로 이어하기
    if (timerSecondsRef.current > 0) {
      setIsTimerRunning(true)
      return
    }

    // 시간이 0이면 새로 시작
    setTimerSeconds(adjustedDuration)
    setIsTimerRunning(true)
  }, [adjustedDuration])

  const handlePauseTimer = React.useCallback(() => {
    setIsTimerRunning(false)
  }, [])

  const handleResetTimer = React.useCallback(() => {
    setIsTimerRunning(false)
    setTimerSeconds(adjustedDuration)
  }, [adjustedDuration])

  const handleAddMinute = React.useCallback(() => {
    setTimerSeconds((prev) => prev + 60)
  }, [])

  const setAiOpenSafe = (v: boolean) => {
    aiOpenRef.current = v
    setAiOpen(v)
  }

  const setAiVoiceEnabledSafe = (v: boolean) => {
    aiVoiceEnabledRef.current = v
    setAiVoiceEnabled(v)
  }

  const setAiTurnSafe = (v: "listening" | "thinking") => {
    aiTurnRef.current = v
    setAiTurn(v)
  }

  // ====== STT 1회 실행 + 자동 재시작(채팅 열려있을 때만) ======
  const runSttOnce = React.useCallback(async () => {
    safeStopStt()

    if (micPermission !== "granted") return
    if (!aiOpenRef.current) return
    if (!aiVoiceEnabledRef.current) return
    if (aiTurnRef.current !== "listening") return

    await porcupineRef.current?.stop()

    try {
      const { token, region } = await fetchSpeechToken()

      const ctrl = await startSttOnce({
        token,
        region,
        onFinal: async (text) => {
          const raw = (text || "").trim()
          if (!raw) return

          const norm = raw.replace(/[^\p{L}\p{N}\s]/gu, "").trim()
          const isCloseIntent = /(채팅|챗봇|셰프|도우미)?\s*(닫아|닫기|종료|끝|그만|나가|꺼)/.test(norm)

          if (isCloseIntent) {
            clearSttRetryTimer()
            safeStopStt()
            setAiOpenSafe(false)
            setAiVoiceEnabledSafe(false)
            // 채팅 닫히면 KWS 재개
            await startKwsIfNeeded()
            return
          }

          setAiMessages((prev) => [...prev, { role: "user", content: raw }])

          setAiTurnSafe("thinking")

          // ✅ WebSocket으로 전송 (기존 API 호출 대체)
          if (stompClientRef.current && stompClientRef.current.connected) {
            const payload = {
              content: raw,
              recipeId: recipeId,
              currentStepNumber: stepIndexRef.current + 1
            }
            stompClientRef.current.publish({
              destination: "/app/recipes/ask",
              body: JSON.stringify(payload),
            })
            // 응답은 WebSocket subscribe에서 처리
          } else {
            setAiMessages((prev) => [...prev, { role: "ai", content: "서버 연결이 원활하지 않아 메시지를 보낼 수 없어요." }])
            setAiTurnSafe("listening")
          }

          // 참고: 기존에는 await postCookingChat() 후 setAiTurnSafe("listening")을 했으나,
          // 소켓은 비동기이므로 응답을 받을 때 상태를 변경해야 함.
          // 여기서 강제로 listening으로 돌리면 "생각중" UI가 순식간에 사라짐.
          // 하지만 백엔드가 아직 응답을 안 주므로... 일단 UI 흐름상 "thinking" 유지하거나,
          // 사용자 경험을 위해 잠시 후 listening으로 복귀시키는 타임아웃을 둘 수 있음.
          // (일단 여기서는 socket send success 가정하고 넘어감)

          setAiTurnSafe("listening")

          if (aiOpenRef.current && aiVoiceEnabledRef.current) {
            scheduleSttRetry(150)
          }
        },
        onError: () => {
          // 에러 시에도 채팅 열려있으면 재시도
          if (aiOpenRef.current && aiVoiceEnabledRef.current && aiTurnRef.current === "listening") {
            scheduleSttRetry(400)
          } else {
            // 채팅 닫혔으면 KWS 재개
            startKwsIfNeeded()
          }
        },
      })

      sttStopRef.current = ctrl.stop
    } catch {
      if (aiOpenRef.current && aiVoiceEnabledRef.current && aiTurnRef.current === "listening") {
        scheduleSttRetry(400)
      } else {
        startKwsIfNeeded()
      }
    }
  }, [micPermission, safeStopStt])

  const clearSttRetryTimer = React.useCallback(() => {
    if (sttRetryTimerRef.current !== null) {
      window.clearTimeout(sttRetryTimerRef.current)
      sttRetryTimerRef.current = null
    }
  }, [])

  const scheduleSttRetry = React.useCallback((delayMs: number) => {
    clearSttRetryTimer()
    sttRetryTimerRef.current = window.setTimeout(() => {
      sttRetryTimerRef.current = null

      // 채팅이 닫혔거나 음성모드가 아니면 재시작 금지
      if (!aiOpenRef.current) return
      if (!aiVoiceEnabledRef.current) return
      if (aiTurnRef.current !== "listening") return

      runSttOnce()
    }, delayMs)
  }, [clearSttRetryTimer, runSttOnce])

  const startKwsIfNeeded = React.useCallback(async () => {
    if (!isListeningRef.current) return
    if (aiOpenRef.current) return
    await porcupineRef.current?.start()
  }, [])

  const stopKws = React.useCallback(async () => {
    await porcupineRef.current?.stop()
  }, [])

  const stopAllAudio = React.useCallback(() => {
    // STT 재시작 타이머 끊기
    clearSttRetryTimer()

    // STT stop
    safeStopStt()

    // STT 관련 상태도 꺼두기(재점화 방지)
    setAiVoiceEnabledSafe(false)
    setAiTurnSafe("listening")
    setAiOpenSafe(false)

    // KWS stop (비동기지만 cleanup에선 fire-and-forget)
    porcupineRef.current?.stop()
  }, [clearSttRetryTimer, safeStopStt])

  const shutdownAudioForNavigation = React.useCallback(() => {
    // ✅ 셧다운 중 플래그 (재시작 방지)
    shuttingDownRef.current = true

    // STT 재시작 타이머 끊기
    clearSttRetryTimer()

    // STT stop
    safeStopStt()

    // AI 상태 OFF
    setAiVoiceEnabledSafe(false)
    setAiTurnSafe("listening")
    setAiOpenSafe(false)

    // ✅ 제일 중요: 음성 제어 자체를 OFF로 내려서 KWS effect가 다시 start 못 하게 함
    setIsListening(false)
    isListeningRef.current = false

    // KWS stop
    porcupineRef.current?.stop()
  }, [clearSttRetryTimer, safeStopStt])

  React.useEffect(() => {
    return () => {
      stopAllAudio()
    }
  }, [stopAllAudio])
  // ====== Porcupine KWS: isListening=true AND aiOpen=false 일 때만 켜기 ======
  React.useEffect(() => {
    if (micPermission !== "granted") return

    // 듣기 OFF면: KWS 끄기 + STT도 끄기
    if (!isListening) {
      safeStopStt()
      porcupineRef.current?.stop()
      return
    }

    // 채팅 열려있으면 KWS 끔 (원래 너가 원했던 정책)
    if (aiOpen) {
      porcupineRef.current?.stop()
      return
    }

    // 처음 한 번만 컨트롤러 생성
    if (!porcupineRef.current) {
      porcupineRef.current = createPorcupineController({
        accessKey: "PdCMcmOqLkfpf+23tTzvPe2TIro/Kae/vMNBas8v5vhUso6Yo9UWAQ==",
        modelPublicPath: "/porcupine/ko.pv",
        keywords: [
          { label: "WAKE", publicPath: "/porcupine/wake.ppn" },
          { label: "NEXT", publicPath: "/porcupine/next.ppn" },
          { label: "PREV", publicPath: "/porcupine/prev.ppn" },
          { label: "PLAY", publicPath: "/porcupine/play.ppn" },
          { label: "PAUSE", publicPath: "/porcupine/pause.ppn" },
        ],
        onCommand: async (cmd) => {
          console.log("[KWS] detected:", cmd)

          // WAKE: 채팅 열고 STT 시작
          if (cmd === "WAKE") {
            await porcupineRef.current?.stop()
            setAiOpenSafe(true)

            setAiVoiceEnabledSafe(true)
            aiVoiceEnabledRef.current = true
            setAiTurnSafe("listening")
            aiTurnRef.current = "listening"

            scheduleSttRetry(50)
            return
          }

          if (cmd === "NEXT") goNextStep()
          if (cmd === "PREV") goPrevStep()
          if (cmd === "PLAY") handleStartTimer()
          if (cmd === "PAUSE") handlePauseTimer()
        },
      })
    }

    porcupineRef.current.start()

    return () => {
      porcupineRef.current?.stop()
    }
  }, [isListening, aiOpen, micPermission, runSttOnce, goNextStep, goPrevStep, handleStartTimer, handlePauseTimer, safeStopStt])

  React.useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        stopAllAudio()
        return
      }

      // ✅ visible로 돌아오면, 사용자가 듣기 ON이고 채팅이 닫혀있을 때만 KWS 재개
      if (
        !shuttingDownRef.current &&
        micPermission === "granted" &&
        isListeningRef.current &&
        !aiOpenRef.current
      ) {
        porcupineRef.current?.start()
      }
    }

    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [micPermission, stopAllAudio])

  React.useEffect(() => {
    const onShutdown = () => shutdownAudioForNavigation()
    window.addEventListener("cooksync:audio-shutdown", onShutdown)
    return () => window.removeEventListener("cooksync:audio-shutdown", onShutdown)
  }, [shutdownAudioForNavigation])

  // ===== AI 플로팅 이벤트 리스너(유지) =====
  React.useEffect(() => {
    const onOpen = () => setAiOpenSafe(true)
    const onClose = () => setAiOpenSafe(false)
    const onToggle = () => setAiOpen((v) => !v)

    window.addEventListener("cooksync:ai-open", onOpen)
    window.addEventListener("cooksync:ai-close", onClose)
    window.addEventListener("cooksync:ai-toggle", onToggle)

    return () => {
      window.removeEventListener("cooksync:ai-open", onOpen)
      window.removeEventListener("cooksync:ai-close", onClose)
      window.removeEventListener("cooksync:ai-toggle", onToggle)
    }
  }, [])

  // ===== AI 메시지 전송 (WebSocket) =====
  const handleAiSend = async () => {
    if (!aiInput.trim()) return
    const userText = aiInput.trim()

    setAiMessages((prev) => [...prev, { role: "user", content: userText }])
    setAiInput("")
    setAiTurnSafe("thinking")

    if (stompClientRef.current && stompClientRef.current.connected) {
      const payload = {
        content: userText,
        recipeId: recipeId,
        currentStepNumber: currentStepIndex + 1
      }
      stompClientRef.current.publish({
        destination: "/app/recipes/ask",
        body: JSON.stringify(payload),
      })
    } else {
      setAiMessages((prev) => [...prev, { role: "ai", content: "서버와 연결되지 않았어요." }])
      setAiTurnSafe("listening")
    }
  }

  // ===== 단계 변경 시 타이머 초기화 (자동 타이머 시작/마이크 자동ON은 하지 않음: 덜 꼬임) =====
  React.useEffect(() => {
    setTimerSeconds(getAdjustedDuration(currentStep.duration, skillLevel))
    //    setIsTimerRunning(false) // (원하면 true로 자동 시작)
    setIsTimerRunning(isTimerRunningRef.current)
    prevStepRef.current = currentStepIndex
  }, [currentStepIndex, currentStep.duration, skillLevel])

  // ===== 숙련도 변경 시 타이머 비례 조정 =====
  React.useEffect(() => {
    if (prevSkillLevelRef.current !== skillLevel) {
      const prevAdjusted = getAdjustedDuration(currentStep.duration, prevSkillLevelRef.current)
      const newAdjusted = getAdjustedDuration(currentStep.duration, skillLevel)

      if (prevAdjusted > 0) {
        const proportionRemaining = timerSeconds / prevAdjusted
        const newRemainingTime = Math.round(newAdjusted * proportionRemaining)
        setTimerSeconds(newRemainingTime)
      } else {
        setTimerSeconds(newAdjusted)
      }

      prevSkillLevelRef.current = skillLevel
    }
  }, [skillLevel, currentStep.duration, timerSeconds])

  // ===== 자동 다음 단계 이동 =====
  React.useEffect(() => {
    if (pendingAdvanceRef.current) {
      pendingAdvanceRef.current = false
      setCompletedSteps((prev) => new Set([...prev, currentStepIndex]))
      if (currentStepIndex < steps.length - 1) {
        onStepChange(currentStepIndex + 1)
      } else {
        onComplete()
      }
    }
  }, [timerSeconds, currentStepIndex, steps.length, onStepChange, onComplete])

  // ===== 타이머 카운트다운 =====
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const newValue = prev - 1
          if (newValue <= 0) {
            setIsTimerRunning(false)
            if (autoAdvance) pendingAdvanceRef.current = true
            return 0
          }
          return newValue
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timerSeconds, autoAdvance])

  React.useEffect(() => {
    if (!aiOpen) {
      clearSttRetryTimer()
      safeStopStt()
      // 음성모드 상태도 같이 꺼두는 게 안전
      setAiVoiceEnabledSafe(false)
      aiVoiceEnabledRef.current = false
      setAiTurnSafe("listening")
      startKwsIfNeeded()
    }
  }, [aiOpen, clearSttRetryTimer, safeStopStt])

  // ===== 음성 제어 토글 =====
  const handleVoiceToggle = async () => {
    if (shuttingDownRef.current) return
    if (micPermission !== "granted") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
        setMicPermission("granted")
        setIsListening(true)  // 권한 받았으면 바로 ON
      } catch {
        setMicPermission("denied")
      }
      return
    }
    setIsListening((prev) => !prev)
  }

  // ===== 숙련도 변경 핸들러 =====
  const handleSkillLevelChange = (newLevel: SkillLevel) => {
    setSkillLevel(newLevel)
  }

  // ===== 단계 이동 핸들러 (UI 버튼용) =====
  const handleNextStep = () => goNextStep()
  const handlePrevStep = () => goPrevStep()

  // ===== 타이머 포맷팅 =====
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden text-gray-900">
      {/* 1. 상단바: 그리드를 사용하여 Progress 바를 중앙에 배치 */}
      <header className="shrink-0 border-b bg-white px-6 py-2">
        <div className="max-w-[1200px] mx-auto grid grid-cols-3 items-center">
          {/* 왼쪽: 돌아기기 + 레시피명 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="flex items-center justify-center text-gray-400 hover:text-[#800020] transition-colors"
              aria-label="돌아가기"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 overflow-hidden">
              <h2 className="font-bold text-base text-gray-800 truncate max-w-[200px]">{recipeName}</h2>
              <Badge variant="outline" className="text-[#800020] border-[#800020] h-4 text-[9px] px-1.5 shrink-0">
                STEP {currentStepIndex + 1}
              </Badge>
            </div>
          </div>

          {/* 중앙: Progress 바 */}
          <div className="flex items-center gap-3 justify-center">
            <Progress value={totalProgress} className="h-1 w-full max-w-[200px]" />
            <span className="text-[10px] font-bold text-gray-400 shrink-0">{Math.round(totalProgress)}%</span>
          </div>

          {/* 오른쪽: 밸런스를 위한 빈 공간 */}
          <div className="flex justify-end" />
        </div>
      </header>

      {/* 2. 메인: 여백 유지하면서 콘텐츠 집중 */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-10 px-8 pt-6 overflow-hidden pb-12">
        {/* 왼쪽: 이미지(4:3) + 설명 */}
        <section className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="relative aspect-[4/3] h-[54vh] max-h-[54vh] w-auto max-w-full mx-auto rounded-2xl overflow-hidden border border-gray-100 shadow-2xl transform transition-transform duration-500">
            <img
              src={currentStep.imageUrl || "/placeholder.svg"}
              className="w-full h-full object-cover"
              alt="조리 단계"
            />
          </div>
          <div className="space-y-4 px-1">
            {(() => {
              const tipMatch = currentStep.description.match(/\[TIP\]\s*(.*)/i);
              const cleanDescription = tipMatch ? currentStep.description.replace(/\[TIP\].*/i, "").trim() : currentStep.description;
              const extractedTip = tipMatch ? tipMatch[1].trim() : currentStep.tips;

              return (
                <>
                  <p className="text-[18px] text-gray-900 leading-[1.5] font-medium break-keep tracking-tight">
                    {cleanDescription}
                  </p>
                  {extractedTip && (
                    <div className="flex items-center gap-4 py-3.5 px-4 rounded-2xl bg-[#800020]/5 border border-[#800020]/5 hover:border-[#800020]/15 transition-all duration-300">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white shadow-sm border border-[#800020]/10">
                        <img
                          src="/chef-tip.png"
                          alt="Tip icon"
                          className="w-full h-full object-contain p-1.5"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-[#800020] tracking-wider uppercase text-[10px] opacity-70">Expert Tip</span>
                        <span className="text-sm text-foreground/80 font-medium leading-normal">{extractedTip}</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        {/* 오른쪽: 박스 그룹 크기 최적화 (flex-1 제거) */}
        <aside className="lg:w-[240px] shrink-0 flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-20">
          {/* 타이머 박스 */}
          <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                <Timer className="w-3.5 h-3.5" /> 타이머
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-gray-400">자동 진행</span>
                <Switch
                  checked={autoAdvance}
                  onCheckedChange={setAutoAdvance}
                  className="scale-[0.55] data-[state=checked]:bg-[#800020]"
                />
              </div>
            </div>
            <div className="text-3xl font-black text-center mb-2 text-[#800020] tabular-nums">
              {formatTime(timerSeconds)}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                size="sm"
                onClick={isTimerRunning ? handlePauseTimer : handleStartTimer}
                className="bg-[#800020]/5 border border-[#800020] text-[#800020] hover:bg-[#800020]/10 h-7.5 text-[10.5px] font-bold rounded-lg"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 mr-1" />
                    정지
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1" />
                    시작
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetTimer}
                className="h-7.5 rounded-lg border-gray-100"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={handleAddMinute}
              className="w-full h-7 mt-1.5 text-gray-500 font-bold text-[9px] hover:bg-gray-50"
            >
              <Plus className="w-2.5 h-2.5 mr-1" /> 1분 추가
            </Button>
          </div>

          {/* 숙련도 박스 */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
              <ChefHat className="w-3.5 h-3.5" />
              <span>숙련도</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "beginner" as SkillLevel, label: "초보", percent: "125%" },
                { id: "intermediate" as SkillLevel, label: "중수", percent: "100%" },
                { id: "expert" as SkillLevel, label: "고수", percent: "75%" },
              ].map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleSkillLevelChange(level.id)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-lg border transition-all gap-0.5 bg-transparent",
                    skillLevel === level.id
                      ? "border-[#800020] text-[#800020] bg-[#800020]/5 font-bold shadow-sm"
                      : "border-gray-100 bg-transparent text-gray-400 hover:border-gray-200",
                  )}
                >
                  <span className="text-[11px] leading-none">{level.label}</span>
                  <span className="text-[8px] opacity-70 font-mono">{level.percent}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 음성 제어 박스 */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
              <Mic className="h-3.5 w-3.5" />
              <span>음성 제어</span>
            </div>
            <div className="flex flex-col items-center">
              {micPermission !== "granted" ? (
                <div className="rounded-md border border-[#800020]/20 bg-[#800020]/5 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                  마이크 권한이 없어 <span className="font-semibold text-foreground">음성 인식 기능</span>을 사용할 수 없습니다.
                  <br />
                  (주소창 옆 ⓘ → 마이크 허용)
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center mb-4">
                    <button
                      onClick={handleVoiceToggle}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-sm mb-2",
                        isListening
                          ? "bg-[#800020] border-[#800020] shadow-[#800020]/20 animate-pulse text-white"
                          : "bg-transparent border-gray-100 text-gray-400 hover:border-[#800020] hover:bg-[#800020]/5 hover:text-[#800020]",
                      )}
                    >
                      {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </button>

                    <p
                      className={cn(
                        "text-[9px] px-2.5 py-1 rounded-full font-bold transition-colors",
                        isListening ? "bg-[#800020]/5 text-[#800020]" : "bg-gray-50 text-gray-400",
                      )}
                    >
                      {isListening ? <WaveText text="음성 명령 대기 중..." /> : "버튼을 눌러 음성 제어 켜기"}
                    </p>
                  </div>

                  <div className="w-full pt-3 mt-1 border-t border-gray-50">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {[
                        { cmd: "이전 단계", desc: "이전 단계 이동" },
                        { cmd: "다음 단계", desc: "다음 단계 이동" },
                        { cmd: "일시정지", desc: "타이머 정지" },
                        { cmd: "이어하기", desc: "타이머 재생" },
                        { cmd: "셰프님", desc: "AI 호출" },
                        { cmd: "채팅 종료", desc: "AI 종료" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-medium text-[#800020] whitespace-nowrap">
                            {item.cmd}
                          </span>
                          <span className="text-[8px] text-gray-400 font-normal whitespace-nowrap">
                            {item.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* 3. 하단 바: 더 슬림하게 조정 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-1.5 z-40">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="font-bold text-gray-500 hover:text-[#800020] h-9 px-0"
          >
            <ChevronLeft className="mr-1 w-4 h-4" /> 이전 단계
          </Button>

          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 h-1 rounded-full",
                  i === currentStepIndex
                    ? "bg-[#800020] w-3 transition-all"
                    : completedSteps.has(i) || i < currentStepIndex
                      ? "bg-[#800020]/60"
                      : "bg-gray-200",
                )}
              />
            ))}
          </div>

          <Button
            onClick={handleNextStep}
            className="bg-[#800020] hover:bg-[#800020]/90 h-9 px-8 rounded-lg font-bold text-sm"
          >
            {currentStepIndex === steps.length - 1 ? "요리 완료" : "다음 단계"}
            <ChevronRight className="ml-1 w-4 w-4" />
          </Button>
        </div>
      </footer>

      {/* ===== Floating AI (Button + Floating Chat Popover) ===== */}
      <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 70 }}>
        {/* Chat Popover (opens above the button) */}
        {aiOpen && (
          <div className="absolute bottom-[72px] right-0 w-[320px] max-w-[92vw] rounded-2xl border bg-background shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="h-12 px-4 border-b flex items-center justify-between bg-[#800020]/5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[#800020] flex items-center justify-center overflow-hidden">
                  <img src="/chef_cursor.png" alt="AI" className="h-5 w-5 object-contain" draggable={false} />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">AI 도우미</p>
                  <p className="text-[11px] text-muted-foreground">요리 중 질문을 바로 해결</p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={async () => {
                  clearSttRetryTimer()
                  setAiOpenSafe(false)
                  safeStopStt()
                  // 채팅을 수동으로 닫으면 KWS 재개(음성 제어 켜져있을 때)
                  if (isListeningRef.current) {
                    await porcupineRef.current?.start()
                  }
                }}
                aria-label="AI 닫기"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="h-[360px] overflow-y-auto px-4 py-3 space-y-3 bg-muted/20">
              {aiMessages.map((m, idx) => (
                <div key={idx} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line",
                      m.role === "user"
                        ? "bg-[#800020] text-white rounded-br-md"
                        : "bg-white border shadow-sm rounded-bl-md",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={aiEndRef} />
            </div>

            {/* Footer */}
            <div className="h-14 border-t bg-white px-3 flex items-center gap-2">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="예: 다음 단계 핵심만 요약해줘"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAiSend()
                  }
                }}
                className="rounded-full"
              />
              <Button
                type="button"
                onClick={handleAiSend}
                disabled={!aiInput.trim()}
                size="icon"
                className="rounded-full bg-[#800020] hover:bg-[#800020]/90"
                aria-label="전송"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          type="button"
          onClick={async () => {
            if (aiToggleLockRef.current) return
            aiToggleLockRef.current = true
            try {
              if (aiOpenRef.current) {
                clearSttRetryTimer()
                safeStopStt()
                setAiVoiceEnabledSafe(false)
                setAiTurnSafe("listening")
                setAiOpenSafe(false)
                // 채팅을 닫으면 KWS는 음성 제어 켜져있을 때만 재개
                if (isListeningRef.current) {
                  await porcupineRef.current?.start()
                }
              } else {
                // ---- 열기 ----
                setAiOpenSafe(true)
                setAiVoiceEnabledSafe(true)
                setAiTurnSafe("listening")
                // 마이크 충돌 방지: KWS 먼저 stop
                await porcupineRef.current?.stop()
                scheduleSttRetry(50)
              }
            } finally {
              setTimeout(() => { aiToggleLockRef.current = false }, 150)
            }
          }}
          aria-label="AI 열기"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl shadow-[#800020]/25 grid place-items-center",
            "bg-[#F2E5E8] hover:bg-[#F2E5E8]/90 transition-colors",
            "border border-[#800020]/30 hover:border-[#800020]/45",
          )}
        >
          <img src="/chef_cursor.png" alt="AI" className="h-10 w-10 object-contain" draggable={false} />
        </button>
      </div>
    </div>
  )
}
