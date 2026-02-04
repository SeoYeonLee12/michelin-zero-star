"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { MichelinIcon } from "@/components/common/MichelinIcon"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { onSocialLogin } = useAuth()

  useEffect(() => {
    const processLogin = async () => {
      // URL에서 accessToken 추출 (백엔드가 쿼리 파라미터로 보냄)
      const accessToken = searchParams.get("accessToken")

      if (accessToken) {
        try {
          // Context를 통해 로그인 상태 업데이트 (토큰 저장 + 유저정보 조회)
          await onSocialLogin(accessToken)

          // 메인 페이지로 이동
          router.replace("/")
        } catch (error) {
          console.error("소셜 로그인 처리 실패", error)
          router.replace("/login?error=social_login_failed")
        }
      } else {
        router.replace("/login?error=no_token")
      }
    }

    processLogin()
  }, [searchParams, router, onSocialLogin])

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <div className="animate-bounce">
          <MichelinIcon size={64} />
        </div>
        <h2 className="text-xl font-bold">로그인 처리 중입니다...</h2>
        <p className="text-muted-foreground">잠시만 기다려주세요.</p>
      </div>
  )
}

export default function AuthCallbackPage() {
  return (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthCallbackContent />
      </Suspense>
  )
}