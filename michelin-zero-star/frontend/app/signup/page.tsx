"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Check, Mic, Users, Search, Home } from "lucide-react"
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

const mockNicknames = ["민지", "요리왕", "쉐프김", "맛집탐방"]

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [nicknameError, setNicknameError] = React.useState("")
  const [emailError, setEmailError] = React.useState("")
  const [formData, setFormData] = React.useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = React.useState(false)

  const passwordRequirements = [
    { label: "8자 이상", met: formData.password.length >= 8 },
    { label: "영문 포함", met: /[a-zA-Z]/.test(formData.password) },
    { label: "숫자 포함", met: /\d/.test(formData.password) },
    { label: "특수기호 (@$!%*#?&) 포함", met: /[@$!%*#?&]/.test(formData.password) },
  ]

  const allRequirementsMet = passwordRequirements.every((req) => req.met)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, email: value })

    if (value && !validateEmail(value)) {
      setEmailError("올바른 이메일을 입력해 주세요")
    } else {
      setEmailError("")
    }
  }

  const checkNicknameDuplicate = (nickname: string) => {
    if (!nickname.trim()) {
      setNicknameError("")
      return
    }
    if (mockNicknames.includes(nickname)) {
      setNicknameError("이미 사용 중인 닉네임입니다")
    } else {
      setNicknameError("")
    }
  }

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, nickname: value })
    checkNicknameDuplicate(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Name validation
    if (formData.name.length < 2 || formData.name.length > 10) {
      alert("이름은 2자 이상 10자 이하로 입력해주세요.")
      return
    }

    // Nickname validation
    if (formData.nickname.length < 2 || formData.nickname.length > 12) {
      setNicknameError("닉네임은 2자 이상 12자 이하로 입력해주세요.")
      return
    }

    if (emailError || !validateEmail(formData.email)) {
      setEmailError("올바른 이메일을 입력해 주세요")
      alert("올바른 이메일을 입력해 주세요")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    // Password validation (Double check length explicitly here too)
    if (formData.password.length < 8 || formData.password.length > 20) {
      alert("비밀번호는 8자 이상 20자 이하로 입력해주세요.")
      return
    }

    if (!allRequirementsMet) {
      alert("비밀번호 조건을 모두 충족해주세요.")
      return
    }
    if (nicknameError) {
      alert("닉네임을 확인해주세요.")
      return
    }
    if (!formData.nickname.trim()) {
      alert("닉네임을 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      await signup({
        name: formData.name,
        nickname: formData.nickname,
        email: formData.email,
        password: formData.password,
      })
      router.push("/")
    } catch (error: any) {
      console.error(error)
      alert(error.message || "회원가입에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Home Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-[#800020] hover:bg-[#800020]/5 transition-all group"
          onClick={() => router.push("/")}
        >
          <Home className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          <span className="font-medium">홈으로</span>
        </Button>
      </div>

      {/* Left Panel - Features */}
      <DotPatternBackground
        containerClassName="hidden lg:flex lg:w-1/2 min-h-screen bg-background"
        className="flex flex-col justify-center items-center w-full p-12"
      >
        <div className="flex items-center gap-3 mb-10">
          <MichelinIcon
            size={56}
            className="rounded-2xl bg-[#FEF2F2] shadow-lg"
            imgClassName="h-9 w-9"
          />
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

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <MichelinIcon
              size={40}
              className="rounded-xl bg-[#800020]"
              imgClassName="h-6 w-6"
            />

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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={10}
                  className="h-12"
                />
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
                  maxLength={12}
                  className={`h-12 ${nicknameError ? "border-destructive" : ""}`}
                />
                {nicknameError && <p className="text-xs text-destructive">{nicknameError}</p>}

              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleEmailChange}
                required
                maxLength={50}
                className={`h-12 ${emailError ? "border-destructive" : ""}`}
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  maxLength={20}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.label}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${req.met ? "bg-[#800020]/10 text-[#800020]" : "bg-muted text-muted-foreground"}`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${req.met ? "bg-[#800020]" : "bg-muted-foreground/30"}`}
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
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                maxLength={20}
                className="h-12"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-[#800020] hover:bg-[#800020]/90"
              disabled={isLoading || !allRequirementsMet || !!nicknameError}
            >
              {isLoading ? "가입 중..." : "회원가입"}
            </Button>
          </form>



          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-[#800020] hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
