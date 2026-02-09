// michelin-zero-star\frontend\app\api\v1\auth\logout\route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
    try {
        // 1. Authorization 헤더 가져오기
        const authHeader = request.headers.get("Authorization")

        if (!authHeader) {
            return NextResponse.json(
                { message: "Authorization 헤더가 없습니다." },
                { status: 401 }
            )
        }

        // 2. 백엔드로 로그아웃 요청
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:8080"
        const response = await fetch(`${backendUrl}/api/v1/auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
        })

        // 3. 프론트엔드 쿠키 삭제
        const cookieStore = await cookies()
        cookieStore.delete("refreshToken")

        // 4. 백엔드 응답 반환
        const data = await response.text()
        return NextResponse.json(
            { message: data || "로그아웃 되었습니다." },
            { status: response.ok ? 200 : response.status }
        )
    } catch (error) {
        console.error("[Logout API Route] Error:", error)

        // 에러가 나더라도 쿠키는 삭제
        const cookieStore = await cookies()
        cookieStore.delete("refreshToken")

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        )
    }
}
