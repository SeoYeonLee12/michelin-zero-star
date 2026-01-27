"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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

export function StepCookMode({ steps, currentStepIndex, onStepChange, onComplete, recipeName }: any) {
  const router = useRouter()
  
  // ===== State 관리 =====
  const [skillLevel, setSkillLevel] = React.useState<SkillLevel>("intermediate")
  const [timerSeconds, setTimerSeconds] = React.useState(0)
  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set())
  const [autoAdvance, setAutoAdvance] = React.useState(true)
  const [isListening, setIsListening] = React.useState(false)
  const [micPermission, setMicPermission] = React.useState<"unknown" | "granted" | "denied">("unknown")
  
  // AI 플로팅 관련
  const [aiOpen, setAiOpen] = React.useState(false)
  const [aiInput, setAiInput] = React.useState("")
  const [aiMessages, setAiMessages] = React.useState<Array<{ role: "user" | "ai"; content: string }>>([
    { role: "ai", content: "요리 중 궁금한 걸 말씀해 주세요. (예: '다음 단계 요약해줘')" },
  ])
  
  const pendingAdvanceRef = React.useRef(false)
  const prevStepRef = React.useRef(currentStepIndex)
  const prevSkillLevelRef = React.useRef(skillLevel)
  const aiEndRef = React.useRef<HTMLDivElement>(null)

  const currentStep = steps[currentStepIndex]
  const totalProgress = ((currentStepIndex + 1) / steps.length) * 100
  const adjustedDuration = getAdjustedDuration(currentStep.duration, skillLevel)

  // ===== X 버튼 클릭 핸들러 =====
  const handleClose = () => {
    router.back()
  }

  // ===== 마이크 권한 체크 =====
  React.useEffect(() => {
    const requestMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
        setMicPermission("granted")
      } catch (e) {
        setMicPermission("denied")
      }
    }
    requestMicPermission()
  }, [])

  // ===== AI 플로팅 이벤트 리스너 =====
  React.useEffect(() => {
    const onOpen = () => setAiOpen(true)
    const onClose = () => setAiOpen(false)
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

  // ===== AI 메시지 자동 스크롤 =====
  React.useEffect(() => {
    if (!aiOpen) return
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [aiMessages, aiOpen])

  // ===== AI 메시지 전송 =====
  const handleAiSend = () => {
    if (!aiInput.trim()) return
    const userText = aiInput.trim()

    setAiMessages((prev) => [...prev, { role: "user", content: userText }])
    setAiInput("")

    // TODO: 실제 AI 연동 시 여기만 교체
    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `(${userText}) 관련해서 도와드릴게요.\n현재 STEP ${currentStep.stepNumber}: ${currentStep.action}\n필요하면 '핵심만', '주의점만' 같이 요청해 주세요.`,
        },
      ])
    }, 400)
  }

  // ===== 단계 변경 시 타이머 초기화 =====
  React.useEffect(() => {
    if (prevStepRef.current !== currentStepIndex) {
      setTimerSeconds(getAdjustedDuration(currentStep.duration, skillLevel))
      if (currentStepIndex > 0) {
        setIsTimerRunning(true)
        if (micPermission === "granted") setIsListening(true)
        else setIsListening(false)
      }
    }
    prevStepRef.current = currentStepIndex
  }, [currentStepIndex, currentStep.duration, skillLevel, micPermission])

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
    let interval: NodeJS.Timeout

    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const newValue = prev - 1
          if (newValue <= 0) {
            setIsTimerRunning(false)
            setIsListening(false)
            if (autoAdvance) {
              pendingAdvanceRef.current = true
            }
            return 0
          }
          return newValue
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timerSeconds, autoAdvance])

  // ===== 타이머 핸들러 =====
  const handleStartTimer = () => {
    if (timerSeconds === 0) {
      setTimerSeconds(adjustedDuration)
    }
    setIsTimerRunning(true)
    if (micPermission === "granted") setIsListening(true)
  }

  const handlePauseTimer = () => {
    setIsTimerRunning(false)
  }

  const handleResetTimer = () => {
    setIsTimerRunning(false)
    setTimerSeconds(adjustedDuration)
  }

  const handleAddMinute = () => {
    setTimerSeconds((prev) => prev + 60)
  }

  // ===== 음성 제어 토글 =====
  const handleVoiceToggle = () => {
    if (micPermission !== "granted") return
    setIsListening((prev) => !prev)
  }

  // ===== 숙련도 변경 핸들러 =====
  const handleSkillLevelChange = (newLevel: SkillLevel) => {
    setSkillLevel(newLevel)
  }

  // ===== 단계 이동 핸들러 =====
  const handleNextStep = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStepIndex]))
    if (currentStepIndex === steps.length - 1) {
      onComplete()
    } else {
      onStepChange(currentStepIndex + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1)
    }
  }

  // ===== 타이머 포맷팅 =====
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden text-gray-900">
      {/* 1. 상단바: 빈 공간 제거 */}
      <header className="shrink-0 border-b bg-white px-6 py-3">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-gray-800">{recipeName}</h2>
            <Badge variant="outline" className="text-[#800020] border-[#800020] h-5 text-[10px]">
              STEP {currentStepIndex + 1}
            </Badge>
          </div>
          <div className="flex items-center gap-3 w-1/4">
            <Progress value={totalProgress} className="h-1 flex-1" />
            <span className="text-[10px] font-bold text-gray-400">{Math.round(totalProgress)}%</span>
          </div>
          {/* X 버튼: hover 효과 제거 및 클릭 시 뒤로가기 */}
          <button 
            onClick={handleClose}
            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. 메인: 상단 여백 조정 */}
      <main className="flex-1 max-w-[1000px] mx-auto w-full flex flex-col lg:flex-row gap-5 px-6 pt-5 overflow-hidden pb-24">
        
        {/* 왼쪽: 이미지(4:3) + 설명 */}
        <section className="flex-[1.1] flex flex-col gap-3 min-w-0">
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img 
              src={currentStep.imageUrl || "/placeholder.svg"} 
              className="w-full h-full object-cover" 
              alt="조리 단계" 
            />
          </div>
          <div className="space-y-2">
            <p className="text-base text-gray-700 leading-snug font-medium break-keep">
              {currentStep.description}
            </p>
            {currentStep.tips && (
              <div className="bg-amber-50/50 border-l-2 border-amber-400 p-2.5 rounded-r-lg flex gap-2 items-start">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-tight">{currentStep.tips}</p>
              </div>
            )}
          </div>
        </section>

        {/* 오른쪽: 박스 일렬 배치 */}
        <aside className="lg:w-[260px] shrink-0 flex flex-col gap-3 h-full overflow-y-auto pr-1">
          
          {/* 타이머 박스 */}
          <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 uppercase tracking-tight">
                <Timer className="w-3.5 h-3.5" /> 타이머
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-500">자동 다음 단계</span>
                <Switch 
                  checked={autoAdvance}
                  onCheckedChange={setAutoAdvance}
                  className="scale-[0.6] data-[state=checked]:bg-[#800020]" 
                />
              </div>
            </div>
            <div className="text-4xl font-black text-center mb-3 text-[#800020] tabular-nums">
              {formatTime(timerSeconds)}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button 
                size="sm" 
                onClick={isTimerRunning ? handlePauseTimer : handleStartTimer}
                className="bg-[#800020]/5 border border-[#800020] text-[#800020] hover:bg-[#800020]/10 h-8 text-[11px] font-bold rounded-lg"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 mr-1" />
                    일시정지
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
                className="h-8 rounded-lg border-gray-100"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleAddMinute}
              className="w-full h-7 mt-1.5 text-gray-500 font-bold text-[10px] hover:bg-gray-50"
            >
              <Plus className="w-3 h-3 mr-1" /> 1분 추가
            </Button>
          </div>

          {/* 숙련도 박스 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3 text-[12px] font-bold text-gray-500 uppercase tracking-tight">
              <ChefHat className="w-3.5 h-3.5" />
              <span>숙련도</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'beginner' as SkillLevel, label: '초보', percent: '125%' },
                { id: 'intermediate' as SkillLevel, label: '중수', percent: '100%' },
                { id: 'expert' as SkillLevel, label: '고수', percent: '75%' }
              ].map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleSkillLevelChange(level.id)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-lg border transition-all gap-0.5 bg-transparent",
                    skillLevel === level.id 
                      ? "border-[#800020] text-[#800020] bg-[#800020]/5 font-bold shadow-sm"
                      : "border-gray-100 bg-transparent text-gray-400 hover:border-gray-200"
                  )}
                >
                  <span className="text-[11px] leading-none">{level.label}</span>
                  <span className="text-[8px] opacity-70 font-mono">{level.percent}</span>
                </button>
              ))}
            </div>
          </div>
         
          {/* 음성 제어 박스 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3 text-[12px] font-bold text-gray-500 uppercase tracking-tight">
              <Mic className="h-3.5 w-3.5" />
              <span>음성 제어</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              {micPermission !== "granted" ? (
                <div className="rounded-md border border-[#800020]/20 bg-[#800020]/5 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                  마이크 권한이 없어 <span className="font-semibold text-foreground">음성 인식 기능</span>을 사용할 수 없습니다.
                  <br />
                  (주소창 옆 ⓘ → 마이크 허용)
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-6 w-full">
                    <span className="text-[13px] text-gray-400 uppercase">이전</span>
                    <button
                      onClick={handleVoiceToggle}
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all border shadow-sm",
                        isListening 
                          ? "bg-[#800020] border-[#800020] shadow-[#800020]/20 animate-pulse text-white" 
                          : "bg-transparent border-gray-100 text-gray-400 hover:border-[#800020] hover:bg-[#800020]/5 hover:text-[#800020]"
                      )}
                    >
                      {isListening ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
                    </button>
                    <span className="text-[13px] text-gray-400 uppercase">다음</span>
                  </div>
                  
                  <p className={cn(
                    "text-[9px] px-2.5 py-1 rounded-full font-bold transition-colors mt-1",
                    isListening 
                      ? "bg-[#800020]/5 text-[#800020]" 
                      : "bg-gray-50 text-gray-400"
                  )}>
                    {isListening ? <WaveText text="음성 명령을 기다리고 있어요..." /> : "버튼을 눌러 음성 제어 켜기"}
                  </p>
                </>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* 3. 하단 바 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-2 z-40">
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
            {steps.map((_: any, i: number) => (
              <div 
                key={i} 
                className={cn(
                  "w-1 h-1 rounded-full", 
                  i === currentStepIndex 
                    ? "bg-[#800020] w-3 transition-all" 
                    : completedSteps.has(i) || i < currentStepIndex
                      ? "bg-[#800020]/60"
                      : "bg-gray-200"
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
                onClick={() => setAiOpen(false)}
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
          onClick={() => setAiOpen((v) => !v)}
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