import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
    try {
        // 1. 프론트엔드 쿠키에서 refreshToken 가져오기
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get("refreshToken")?.value

        if (!refreshToken) {
            return NextResponse.json(
                { message: "Refresh Token이 없습니다. 다시 로그인해주세요." },
                { status: 401 }
            )
        }

        // 2. 백엔드로 토큰 재발급 요청 (쿠키 포함)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:8080"
        const response = await fetch(`${backendUrl}/api/v1/auth/reissue`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `refreshToken=${refreshToken}`, // 백엔드로 쿠키 전달
            },
        })

        // 3. 백엔드 응답 처리
        const data = await response.json()

        if (!response.ok) {
            // 리프레시 실패 시 쿠키 삭제
            cookieStore.delete("refreshToken")
            return NextResponse.json(data, { status: response.status })
        }

        // 4. 백엔드가 새로운 refreshToken을 보냈다면 업데이트
        const setCookieHeader = response.headers.get("set-cookie")
        if (setCookieHeader) {
            const refreshTokenMatch = setCookieHeader.match(/refreshToken=([^;]+)/)
            if (refreshTokenMatch) {
                const newRefreshToken = refreshTokenMatch[1]
                cookieStore.set("refreshToken", newRefreshToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "lax",
                    path: "/",
                    maxAge: 7 * 24 * 60 * 60,
                })
            }
        }

        // 5. 새로운 액세스 토큰 반환
        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("[Reissue API Route] Error:", error)
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        )
    }
}
