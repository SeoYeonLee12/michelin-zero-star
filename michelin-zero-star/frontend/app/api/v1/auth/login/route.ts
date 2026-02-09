// michelin-zero-star\frontend\app\api\v1\auth\login\route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // 1. 프론트엔드에서 받은 요청 바디
    const body = await request.json()

    // 2. 백엔드로 로그인 요청
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:8080"
    const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    // 3. 백엔드 응답 처리
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // 4. 백엔드가 보낸 Set-Cookie 헤더 추출
    const setCookieHeader = response.headers.get("set-cookie")
    
    // 5. refreshToken 쿠키를 프론트엔드 도메인으로 설정
    const cookieStore = await cookies()
    if (setCookieHeader) {
      // Set-Cookie 헤더 파싱 (간단한 버전)
      const refreshTokenMatch = setCookieHeader.match(/refreshToken=([^;]+)/)
      if (refreshTokenMatch) {
        const refreshToken = refreshTokenMatch[1]
        cookieStore.set("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false, // 개발 환경
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60, // 7일
        })
      }
    }

    // 6. 액세스 토큰을 응답 바디로 반환
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[Login API Route] Error:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
