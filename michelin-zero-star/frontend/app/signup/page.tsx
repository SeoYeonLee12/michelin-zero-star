"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Check, Mic, Users, Search, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DotPatternBackground } from "@/components/ui/dot-pattern-background"
import { Highlight } from "@/components/ui/text-highlight"
import { useAuth } from "@/lib/auth-context"
import { MichelinIcon } from "@/components/common/MichelinIcon"

const features = [
  { icon: Mic, label: "핸즈프리 요리", desc: "음성으로 레시피를 따라가세요" },
  { icon: Users, label: "재료 나눔", desc: "이웃과 남은 재료를 나눠요" },
  { icon: Search, label: "다양한 레시피", desc: "AI가 맞춤 레시피를 추천해요" },
]

// ====== validators ======
const sanitizeName = (v: string) => v.replace(/[0-9]/g, "")
const isValidName = (v: string) => /^[A-Za-z가-힣\s]{2,20}$/.test(v.trim())
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isValidNickname = (v: string) => /^[A-Za-z0-9가-힣_]{2,12}$/.test(v.trim())
// 닉네임 규칙은 팀 규칙에 맞게 조정 가능(지금은 2~12자, 한/영/숫자/_)

type NicknameStatus = "idle" | "available" | "taken" | "invalid"

export default function SignupPage() {
  const [showSuccessModal, setShowSuccessModal] = React.useState(false)
  const [successStep, setSuccessStep] = React.useState<"loading" | "done">("loading")
  const router = useRouter()
  const { signup } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)

  const [formData, setFormData] = React.useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = React.useState<{
    name?: string
    nickname?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const [nicknameStatus, setNicknameStatus] = React.useState<NicknameStatus>("idle")
  const [isLoading, setIsLoading] = React.useState(false)

  const passwordRequirements = [
    { label: "8자 이상", met: formData.password.length >= 8 },
    { label: "영문 포함", met: /[a-zA-Z]/.test(formData.password) },
    { label: "숫자 포함", met: /\d/.test(formData.password) },
    { label: "특수기호 포함", met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ]
  const allRequirementsMet = passwordRequirements.every((req) => req.met)

  // ===== handlers =====
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeName(e.target.value)
    setFormData((prev) => ({ ...prev, name: value }))
    setErrors((prev) => ({ ...prev, name: undefined }))
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, email: value }))
    setErrors((prev) => ({ ...prev, email: undefined }))
  }

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, nickname: value }))

    // 입력이 바뀌면 서버 기반 상태는 무조건 리셋(이전 "사용가능" 오염 방지)
    setNicknameStatus("idle")
    setErrors((prev) => ({ ...prev, nickname: undefined }))

    // 형식만 즉시 검증(중복은 서버가 판단)
    if (value.trim() && !isValidNickname(value)) {
      setNicknameStatus("invalid")
      setErrors((prev) => ({ ...prev, nickname: "닉네임 형식이 올바르지 않습니다. (2~12자, 한/영/숫자/_)" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 제출 전 프론트 검증
    const nextErrors: typeof errors = {}

    if (!formData.name.trim()) nextErrors.name = "이름을 입력해주세요."
    else if (!isValidName(formData.name)) nextErrors.name = "이름은 한글/영문/공백만 가능하며 2~20자여야 합니다."

    if (!formData.nickname.trim()) nextErrors.nickname = "닉네임을 입력해주세요."
    else if (!isValidNickname(formData.nickname)) nextErrors.nickname = "닉네임 형식이 올바르지 않습니다. (2~12자, 한/영/숫자/_)"

    if (!formData.email.trim()) nextErrors.email = "이메일을 입력해주세요."
    else if (!isValidEmail(formData.email)) nextErrors.email = "이메일 형식이 올바르지 않습니다."

    if (!allRequirementsMet) nextErrors.password = "비밀번호 조건을 모두 충족해주세요."
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "비밀번호가 일치하지 않습니다."

    // 닉네임 형식 invalid 상태면 막기
    if (nicknameStatus === "invalid") {
      nextErrors.nickname = nextErrors.nickname ?? "닉네임을 확인해주세요."
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsLoading(true)
    try {
      await signup({
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })

      // ✅ 성공 모달 시작
      setSuccessStep("loading")
      setShowSuccessModal(true)

      // 로딩(스피너) 잠깐 보여주고 체크로 전환
      window.setTimeout(() => setSuccessStep("done"), 800)

      // 체크 보여준 뒤 로그인 페이지로 이동
      window.setTimeout(() => {
        router.push("/login")
      }, 1600)
    } catch (error: any) {
      const msg = String(error?.message ?? "회원가입에 실패했습니다.").trim()

      // 서버 메시지를 필드 에러로 매핑
      // (백엔드가 한글 메시지로 내려주니까 이 방식이 제일 빠름)
      if (msg.includes("이미 가입된 이메일")) {
        setErrors((prev) => ({ ...prev, email: "이미 가입된 이메일입니다." }))
      } else if (msg.includes("이미 존재하는 닉네임") || msg.includes("이미 사용 중인 닉네임")) {
        setNicknameStatus("taken")
        setErrors((prev) => ({ ...prev, nickname: "이미 존재하는 닉네임입니다." }))
      } else {
        alert(msg)
      }

      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const nicknameHelper = (() => {
    if (!formData.nickname.trim()) return null
    if (errors.nickname) return <p className="text-xs text-destructive">{errors.nickname}</p>
    if (nicknameStatus === "available") return <p className="text-xs text-green-600">사용 가능한 닉네임입니다</p>
    if (nicknameStatus === "taken") return <p className="text-xs text-destructive">이미 존재하는 닉네임입니다.</p>
    return null // idle 상태에서는 아무 말도 안 함(“가능” 오판 금지)
  })()

  return (
    <div className="min-h-screen flex">
      <DotPatternBackground
        containerClassName="hidden lg:flex lg:w-1/2 min-h-screen bg-background"
        className="flex flex-col justify-center items-center w-full p-12"
      >
        <div className="flex items-center gap-3 mb-10">
          <MichelinIcon size={56} className="rounded-2xl bg-[#FEF2F2] shadow-lg" imgClassName="h-9 w-9" />
          <span className="text-3xl font-bold tracking-tight">미슐랭 0스타</span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [20, -5, 0] }}
          transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
          className="text-3xl md:text-4xl lg:text-[36px] font-bold text-foreground max-w-xl leading-relaxed lg:leading-snug text-center"
        >
          회원가입 후 다양한 요리를 즐기고
          <br />
          <Highlight className="text-foreground">알뜰하게 나누세요</Highlight>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-10 space-y-4 w-full max-w-sm"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-[#800020]/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-6 h-6 text-[#800020]" />
              </div>
              <div>
                <span className="font-semibold text-foreground">{feature.label}</span>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </DotPatternBackground>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <MichelinIcon size={40} className="rounded-xl bg-[#800020]" imgClassName="h-6 w-6" />
            <span className="text-2xl font-bold tracking-tight">미슐랭 0스타</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">회원가입</h2>
            <p className="text-muted-foreground">새 계정을 만들고 요리를 시작하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 (실명)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className={`h-12 ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="요리초보"
                  value={formData.nickname}
                  onChange={handleNicknameChange}
                  required
                  className={`h-12 ${errors.nickname ? "border-destructive" : ""}`}
                />
                {nicknameHelper}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleEmailChange}
                required
                className={`h-12 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  required
                  className={`h-12 pr-12 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}

              <div className="flex flex-wrap gap-2 mt-2">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.label}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      req.met ? "bg-[#800020]/10 text-[#800020]" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        req.met ? "bg-[#800020]" : "bg-muted-foreground/30"
                      }`}
                    >
                      {req.met && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {req.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value })
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                }}
                required
                className={`h-12 ${errors.confirmPassword ? "border-destructive" : ""}`}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && !errors.confirmPassword && (
                <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-[#800020] hover:bg-[#800020]/90"
              disabled={isLoading || !allRequirementsMet}
            >
              {isLoading ? "가입 중..." : "회원가입"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* 소셜 로그인 버튼들(문구 'N빵' 같은 건 여기나 다른 UI 텍스트에서 검색해 교체하면 됨) */}
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="h-12 bg-transparent">
              {/* ... */}
              G
            </Button>
            <Button
              variant="outline"
              className="h-12 bg-[#03C75A] hover:bg-[#03C75A]/90 text-white border-[#03C75A]"
            >
              <span className="font-bold text-lg">N</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#3C1E1E] border-[#FEE500]"
            >
              {/* ... */}
              K
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-[#800020] hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
      {/* ✅ Signup Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm min-h-[280px] rounded-2xl bg-white p-8 shadow-xl flex items-center justify-center">
            <div className="flex flex-col items-center text-center gap-4">
              {successStep === "loading" ? (
                <>
                  <Loader2 className="h-14 w-14 animate-spin text-[#800020]" />
                  <div className="text-xl font-semibold">계정 생성 중...</div>
                  <div className="text-sm text-muted-foreground">
                    잠시만 기다려 주세요.
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-14 w-14 text-[#16a34a]" />
                  <div className="text-xl font-semibold">회원가입이 완료되었습니다</div>
                  <div className="text-sm text-muted-foreground">
                    로그인 화면으로 이동합니다.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}