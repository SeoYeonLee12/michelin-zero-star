"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"
import { Client } from "@stomp/stompjs"
import { completeCooking } from "@/lib/api/cook-mode"
import { fetchCookingChatHistory } from "@/lib/cooking-chat-api"
import { getGlobalAccessToken } from "@/lib/api/client"
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
  Plus,
  Send,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { RecipeStep } from "@/lib/types"
import { postCookingChat } from "@/lib/cooking-chat-api"

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

/**
 * ---------------------------
 * Voice Intent Parser (Korean)
 * ---------------------------
 */
type VoiceIntent =
  | { type: "WAKE" }
  | { type: "CLOSE_CHAT" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "CHAT"; text: string }
  | { type: "NONE" }

const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()

function parseVoiceIntent(rawText: string, aiOpen: boolean): VoiceIntent {
  const t = normalize(rawText)
  if (!t) return { type: "NONE" }

  // 채팅 종료/닫기 계열
  if (/(채팅|챗봇|셰프)?\s*(닫아|닫기|종료|끝|그만|나가|꺼)/.test(t)) {
    return { type: "CLOSE_CHAT" }
  }

  // WAKE(호출) 계열
  if (/(셰프(님)?|챗봇|ai야)/.test(t)) {
    return { type: "WAKE" }
  }

  // NEXT 계열
  if (/(다음(으로)?|다음 단계(로)?|넘겨|넘어가|다음 가|다음으로 가)/.test(t)) {
    return { type: "NEXT" }
  }

  // PREV 계열
  if (/(이전(으로)?|전 단계|뒤로|돌아가|이전으로 가)/.test(t)) {
    return { type: "PREV" }
  }

  // PAUSE 계열
  if (/(일시\s*정지|정지|멈춰|스톱|pause)/.test(t)) {
    return { type: "PAUSE" }
  }

  // PLAY 계열
  if (/(시작|재생|이어(서)?\s*(해|하기)|계속(해|하기)|play)/.test(t)) {
    return { type: "PLAY" }
  }

  // 그 외는 "채팅이 열려있을 때만" 질문으로 처리
  if (aiOpen) return { type: "CHAT", text: rawText.trim() }
  return { type: "NONE" }
}

/**
 * ---------------------------
 * Azure STT Continuous Wrapper
 * ---------------------------
 */
type AzureSttController = { stop: () => void }

function startAzureContinuousStt(opts: {
  speechKey: string
  region: string
  language?: string
  onFinal: (text: string) => void
  onPartial?: (text: string) => void
  onError?: (err: any) => void
}): AzureSttController {
  const { speechKey, region, language = "ko-KR", onFinal, onPartial, onError } = opts

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, region)
  speechConfig.speechRecognitionLanguage = language

  // 말 끝 감지(너무 빨리 끊기면 1200~2000, 느리면 600~900)
  speechConfig.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
    "900",
  )

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)

  // 키워드 보정(인식률 개선)
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
    }
  }

  recognizer.canceled = (_s, e) => {
    onError?.(e)
  }

  recognizer.sessionStopped = (_s, e) => {
    onError?.(e)
  }

  recognizer.startContinuousRecognitionAsync(
    () => { },
    (err) => onError?.(err),
  )

  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    try {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          try { recognizer.close() } catch { }
        },
        () => {
          try { recognizer.close() } catch { }
        },
      )
    } catch {
      try { recognizer.close() } catch { }
    }
  }

  return { stop }
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

  // ===== State =====
  const [skillLevel, setSkillLevel] = React.useState<SkillLevel>("intermediate")
  const [timerSeconds, setTimerSeconds] = React.useState(0)
  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set())
  const [autoAdvance, setAutoAdvance] = React.useState(true)

  // 음성
  const [isListening, setIsListening] = React.useState(false)
  const [micPermission, setMicPermission] = React.useState<"unknown" | "granted" | "denied">("unknown")

  // AI 플로팅
  const [aiOpen, setAiOpen] = React.useState(false)
  const [aiInput, setAiInput] = React.useState("")
  // aiMessages: { role, content } 구조 유지하되, 서버 이력과 통합
  const [aiMessages, setAiMessages] = React.useState<Array<{ role: "user" | "ai"; content: string }>>([
    // 초기 환영 메시지 제거/또는 유지 -> 서버 히스토리 로딩 후 결정
    // { role: "ai", content: "요리 중 궁금한 걸 말씀해 주세요. (예: '다음 단계 요약해줘')" },
  ])
  const aiEndRef = React.useRef<HTMLDivElement>(null)

  // STOMP Client
  const stompClientRef = React.useRef<Client | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)

  // 상태 refs (클로저 안전)
  const stepIndexRef = React.useRef(currentStepIndex)
  const aiOpenRef = React.useRef(aiOpen)
  const isListeningRef = React.useRef(isListening)
  const isTimerRunningRef = React.useRef(isTimerRunning)
  const timerSecondsRef = React.useRef(timerSeconds)

  const [aiVoiceEnabled, setAiVoiceEnabled] = React.useState(false)
  const [aiTurn, setAiTurn] = React.useState<"listening" | "thinking">("listening")
  const aiVoiceEnabledRef = React.useRef(aiVoiceEnabled)
  const aiTurnRef = React.useRef(aiTurn)

  React.useEffect(() => { stepIndexRef.current = currentStepIndex }, [currentStepIndex])
  React.useEffect(() => { aiOpenRef.current = aiOpen }, [aiOpen])
  React.useEffect(() => { isListeningRef.current = isListening }, [isListening])
  React.useEffect(() => { isTimerRunningRef.current = isTimerRunning }, [isTimerRunning])
  React.useEffect(() => { timerSecondsRef.current = timerSeconds }, [timerSeconds])
  React.useEffect(() => { aiVoiceEnabledRef.current = aiVoiceEnabled }, [aiVoiceEnabled])
  React.useEffect(() => { aiTurnRef.current = aiTurn }, [aiTurn])

  // 0. 초기 히스토리 로드
  React.useEffect(() => {
    fetchCookingChatHistory(recipeId)
      .then((res) => {
        // 과거 기록 역순? 정순? -> 보통 최신이 위 or 아래. 
        // prompt 예시: aiChatMessageId 10, 9, 4, 3 ... (내림차순으로 옴)
        // 화면 표출은 [오래된 것 ... 최신 것] 순이 자연스러움
        // res.aiChatHistories 가 내림차순이라 가정하고 reverse
        const history = [...res.aiChatHistories].reverse().map((msg) => ({
          role: msg.senderType === "AI" ? ("ai" as const) : ("user" as const),
          content: msg.content,
        }))
        setAiMessages(history)
      })
      .catch((err) => console.error("히스토리 로드 실패:", err))
  }, [recipeId])

  // 1. 소켓 연결
  React.useEffect(() => {
    const token = getGlobalAccessToken()
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws-stomp", // Backend defaults to port 8080, endpoint defined in WebSocketConfig
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      // debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true)
        console.log("STOMP Connected")

        // 구독
        client.subscribe(`/topic/recipe/${recipeId}`, (message) => {
          if (message.body) {
            const body = JSON.parse(message.body)
            // { content: "...", senderType: "USER" | "AI", ... }
            if (body.senderType === "AI") {
              setAiMessages((prev) => [...prev, { role: "ai", content: body.content }])
              setAiTurnSafe("listening") // AI 응답 오면 듣기 모드 복귀? (기획 확인 필요하나 일단 자연스러움)
            } else if (body.senderType === "USER") {
              // 내 메시지도 소켓으로 오면 여기서 추가? 
              // 보통 optimistic update 로 내가 보낸 건 미리 추가함.
              // 중복 방지 로직이 필요할 수도 있음. 일단은 내가 보낸건 aiSend에서 추가하니 여기선 AI만 처리하거나
              // 혹은 aiSend에선 추가 안하고 여기서만 받아도 됨. (반응 속도 차이)
              // prompt 요청사항엔 "응답 페이로드"가 있고 senderType: USER 도 있음.
              // 즉, 내가 보낸 것도 에코로 올 수 있음.
              // 중복 추가 방지를 위해 일단 여기서는 'AI' 것만 처리하거나,
              // handleAiSend에서 낙관적 업데이트를 안하거나 해야 함.
              // 편의상 handleAiSend에서 "낙관적 추가"를 하고, 여기서는 USER 타입은 무시하도록 함(중복 방지).
              // 만약 다른 기기에서 보낸 거라면 받아야겠지만.. 일단 무시.
            }
          }
        })
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"])
        console.error("Additional details: " + frame.body)
      },
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [recipeId])

  // 중복 명령 방지
  const lastIntentRef = React.useRef<{ type: string; ts: number }>({ type: "", ts: 0 })

  // Azure STT 컨트롤러
  const azureSttRef = React.useRef<AzureSttController | null>(null)

  const currentStep = steps[currentStepIndex] || steps[0]
  const totalProgress = ((currentStepIndex + 1) / steps.length) * 100
  const adjustedDuration = currentStep ? getAdjustedDuration(currentStep.duration, skillLevel) : 60

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

  const stopAllAudio = React.useCallback(() => {
    try { azureSttRef.current?.stop() } catch { }
    azureSttRef.current = null
    setAiVoiceEnabledSafe(false)
    setAiTurnSafe("listening")
    setAiOpenSafe(false)
  }, [])

  // 페이지 닫기/뒤로가기
  const handleClose = () => {
    stopAllAudio()
    if (onBack) onBack()
    else router.back()
  }

  // 최초 마이크 권한 확인
  React.useEffect(() => {
    const check = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
        setMicPermission("granted")
        setIsListening(true) // 기본 ON
      } catch (e) {
        setMicPermission("denied")
      }
    }
    check()
  }, [])

  // AI 메시지 자동 스크롤
  React.useEffect(() => {
    if (!aiOpen) return
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [aiMessages, aiOpen])

  // ====== 스텝 이동 (클로저 안전) ======
  const goNextStep = React.useCallback(async () => {
    const idx = stepIndexRef.current
    setCompletedSteps((prev) => new Set([...prev, idx]))


    // 마지막 스텝이면 요리 완료 API 요청 후 onComplete
    if (idx < steps.length - 1) {
      onStepChange(idx + 1)
    } else {
      stopAllAudio()
      setIsListening(false)

      try {
        await completeCooking({ recipeId })
      } catch (err) {
        console.error("요리 완료 API 오류:", err)
      } finally {
        // 성공하든 실패하든 일단 완료 처리
        onComplete()
      }
    }
  }, [steps.length, onStepChange, onComplete, stopAllAudio, recipeId])

  const goPrevStep = React.useCallback(() => {
    const idx = stepIndexRef.current
    if (idx > 0) onStepChange(idx - 1)
  }, [onStepChange])

  // 타이머
  const handleStartTimer = React.useCallback(() => {
    if (isTimerRunningRef.current) return

    if (timerSecondsRef.current > 0) {
      setIsTimerRunning(true)
      return
    }

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

  // ====== 핵심: Azure Continuous STT 시작/정지 ======
  React.useEffect(() => {
    // OFF or 권한없음 => 중지
    if (micPermission !== "granted" || !isListening) {
      try { azureSttRef.current?.stop() } catch { }
      azureSttRef.current = null
      return
    }

    // 이미 켜져있으면 중복 시작 금지
    if (azureSttRef.current) return

    const speechKey = process.env.NEXT_PUBLIC_SPEECH_KEY || ""
    const region = process.env.NEXT_PUBLIC_SPEECH_REGION || ""

    if (!speechKey || !region) {
      console.warn("[Azure STT] Missing NEXT_PUBLIC_SPEECH_KEY or NEXT_PUBLIC_SPEECH_REGION")
      return
    }

    azureSttRef.current = startAzureContinuousStt({
      speechKey,
      region,
      language: "ko-KR",
      onFinal: async (text) => {
        // intent parse
        const intent = parseVoiceIntent(text, aiOpenRef.current)

        // 같은 intent 연속 방지
        const now = Date.now()
        if (intent.type === lastIntentRef.current.type && now - lastIntentRef.current.ts < 800) return
        lastIntentRef.current = { type: intent.type, ts: now }

        // ===== 명령 처리 =====
        if (intent.type === "NEXT") { await goNextStep(); return }
        if (intent.type === "PREV") { goPrevStep(); return }
        if (intent.type === "PAUSE") { handlePauseTimer(); return }
        if (intent.type === "PLAY") { handleStartTimer(); return }

        if (intent.type === "WAKE") {
          setAiOpenSafe(true)
          setAiVoiceEnabledSafe(true)
          setAiTurnSafe("listening")
          return
        }

        if (intent.type === "CLOSE_CHAT") {
          setAiOpenSafe(false)
          setAiVoiceEnabledSafe(false)
          setAiTurnSafe("listening")
          return
        }

        // ===== 채팅 처리 (음성) =====
        if (intent.type === "CHAT") {
          // 채팅 열려있고 + 음성모드 + listening일 때만 전송
          if (!aiOpenRef.current) return
          if (!aiVoiceEnabledRef.current) return
          if (aiTurnRef.current !== "listening") return

          const raw = intent.text.trim()
          if (!raw) return

          // 낙관적 UI 업데이트
          setAiMessages((prev) => [...prev, { role: "user", content: raw }])
          setAiTurnSafe("thinking")

          // 소켓 전송
          if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
              destination: "/pub/recipes/ask",
              body: JSON.stringify({
                content: raw,
                recipeId,
                currentStepNumber: stepIndexRef.current + 1 // 1-based index 인지 확인 (UI상 STEP 1부터 시작하므로 +1)
              })
            })
          } else {
            setAiMessages((prev) => [...prev, { role: "ai", content: "서버와 연결되지 않았습니다." }])
            setAiTurnSafe("listening")
          }
        }
      },
      onError: (e) => {
        // 여기서 에러 로그 남겨야 "마이크가 자꾸 꺼짐" 같은 상황 파악 가능
        console.warn("[Azure Continuous STT] error:", e)
      },
    })

    return () => {
      try { azureSttRef.current?.stop() } catch { }
      azureSttRef.current = null
    }
  }, [micPermission, isListening, recipeId, goNextStep, goPrevStep, handleStartTimer, handlePauseTimer])

  // 탭 숨김/복귀 시 안정화: hidden이면 끄고, visible이면 조건 충족 시 다시 켜짐(위 effect가 처리)
  React.useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        try { azureSttRef.current?.stop() } catch { }
        azureSttRef.current = null
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  // 언마운트 cleanup
  React.useEffect(() => {
    return () => {
      try { azureSttRef.current?.stop() } catch { }
      azureSttRef.current = null
    }
  }, [])

  // ===== 단계 변경 시 타이머 초기화 =====
  React.useEffect(() => {
    setTimerSeconds(getAdjustedDuration(currentStep.duration, skillLevel))
    setIsTimerRunning(isTimerRunningRef.current)
  }, [currentStepIndex, currentStep.duration, skillLevel])

  // ===== 타이머 카운트다운 =====
  const pendingAdvanceRef = React.useRef(false)
  React.useEffect(() => {
    if (pendingAdvanceRef.current) {
      pendingAdvanceRef.current = false
      setCompletedSteps((prev) => new Set([...prev, currentStepIndex]))
      if (currentStepIndex < steps.length - 1) onStepChange(currentStepIndex + 1)
      else onComplete()
    }
  }, [timerSeconds, currentStepIndex, steps.length, onStepChange, onComplete])

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

  // ===== 음성 제어 토글 =====
  const handleVoiceToggle = async () => {
    if (micPermission !== "granted") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
        setMicPermission("granted")
        setIsListening(true)
      } catch {
        setMicPermission("denied")
      }
      return
    }
    setIsListening((prev) => !prev)
  }

  // ===== 숙련도 변경 =====
  const handleSkillLevelChange = (newLevel: SkillLevel) => {
    setSkillLevel(newLevel)
  }

  const handleNextStep = () => goNextStep()
  const handlePrevStep = () => goPrevStep()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // ===== AI 메시지 전송(키보드/버튼) =====
  // ===== AI 메시지 전송(키보드/버튼) =====
  const handleAiSend = () => {
    if (!aiInput.trim()) return
    const userText = aiInput.trim()

    // 낙관적 업데이트
    setAiMessages((prev) => [...prev, { role: "user", content: userText }])
    setAiInput("")
    setAiTurnSafe("thinking")

    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: "/app/recipes/ask",
        body: JSON.stringify({
          content: userText,
          recipeId,
          currentStepNumber: stepIndexRef.current + 1
        })
      })
    } else {
      setAiMessages((prev) => [...prev, { role: "ai", content: "채팅 서버 미연결 상태입니다." }])
      setAiTurnSafe("listening")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden text-gray-900">
      {/* 1. 상단바 */}
      <header className="shrink-0 border-b bg-white px-6 py-2">
        <div className="max-w-[1200px] mx-auto grid grid-cols-3 items-center">
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

          <div className="flex items-center gap-3 justify-center">
            <Progress value={totalProgress} className="h-1 w-full max-w-[200px]" />
            <span className="text-[10px] font-bold text-gray-400 shrink-0">{Math.round(totalProgress)}%</span>
          </div>

          <div className="flex justify-end" />
        </div>
      </header>

      {/* 2. 메인 */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-10 px-8 pt-6 overflow-hidden pb-12">
        {/* 왼쪽 */}
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
              const tipMatch = currentStep.description.match(/\[TIP\]\s*(.*)/i)
              const cleanDescription = tipMatch ? currentStep.description.replace(/\[TIP\].*/i, "").trim() : currentStep.description
              const extractedTip = tipMatch ? tipMatch[1].trim() : currentStep.tips

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
                        <span className="font-extrabold text-[#800020] tracking-wider uppercase text-[10px] opacity-70">
                          Expert Tip
                        </span>
                        <span className="text-sm text-foreground/80 font-medium leading-normal">
                          {extractedTip}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </section>

        {/* 오른쪽 */}
        <aside className="lg:w-[240px] shrink-0 flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-20">
          {/* 타이머 */}
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

          {/* 숙련도 */}
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

          {/* 음성 제어 */}
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
                        { cmd: "이전/뒤로", desc: "이전 단계 이동" },
                        { cmd: "다음/넘겨", desc: "다음 단계 이동" },
                        { cmd: "일시정지/멈춰", desc: "타이머 정지" },
                        { cmd: "이어하기/계속", desc: "타이머 재생" },
                        { cmd: "셰프님", desc: "AI 호출" },
                        { cmd: "채팅 종료/닫아", desc: "AI 종료" },
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

      {/* 3. 하단 바 */}
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

      {/* ===== Floating AI ===== */}
      <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 70 }}>
        {aiOpen && (
          <div className="absolute bottom-[72px] right-0 w-[320px] max-w-[92vw] rounded-2xl border bg-background shadow-2xl overflow-hidden">
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
                onClick={() => {
                  setAiOpenSafe(false)
                  setAiVoiceEnabledSafe(false)
                  setAiTurnSafe("listening")
                }}
                aria-label="AI 닫기"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

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
                disabled={!aiInput.trim() || aiTurn === "thinking"}
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
          onClick={() => {
            if (aiOpenRef.current) {
              setAiOpenSafe(false)
              setAiVoiceEnabledSafe(false)
              setAiTurnSafe("listening")
            } else {
              setAiOpenSafe(true)
              setAiVoiceEnabledSafe(true)
              setAiTurnSafe("listening")
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

