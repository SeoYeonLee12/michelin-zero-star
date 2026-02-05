import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get("refreshToken")?.value

        if (!refreshToken) {
            return NextResponse.json(
                { message: "Refresh Token이 없습니다. 다시 로그인해주세요." },
                { status: 401 }
            )
        }

        // 1. Backend URL 설정
        let backendUrl = process.env.INTERNAL_API_URL

        if (!backendUrl) {
            // Docker 환경에서 localhost는 127.0.0.1이 아니라 서비스명을 써야 함
            if (process.env.NEXT_PUBLIC_API_URL?.includes("localhost")) {
                // Docker Compose 서비스명 'backend'를 우선 시도
                backendUrl = "http://backend:8080/api/v1";
            } else {
                backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api/v1";
            }
        }

        // 2. 백엔드 요청
        try {
            const response = await fetch(`${backendUrl}/auth/reissue`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `refreshToken=${refreshToken}`,
                },
            })

            // 3. 응답 처리
            const contentType = response.headers.get("content-type")
            let data
            if (contentType && contentType.includes("application/json")) {
                data = await response.json()
            } else {
                const text = await response.text()
                data = { message: text || "Error" }
            }

            if (!response.ok) {
                console.warn("[Reissue API] Refresh Failed:", data)
                // 유효하지 않은 토큰이면 쿠키 삭제
                cookieStore.delete("refreshToken")
                return NextResponse.json(data, { status: response.status })
            }

            // 4. 쿠키 갱신 (Backend가 Set-Cookie를 준다면)
            const setCookieHeader = response.headers.get("set-cookie")
            if (setCookieHeader) {
                const refreshTokenMatch = setCookieHeader.match(/refreshToken=([^;]+)/)
                if (refreshTokenMatch) {
                    cookieStore.set("refreshToken", refreshTokenMatch[1], {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        path: "/",
                        maxAge: 7 * 24 * 60 * 60,
                    })
                }
            }

            return NextResponse.json(data, { status: 200 })

        } catch (fetchError) {
            console.warn(`[Reissue API] 1차 시도 실패 (${backendUrl})... host.docker.internal로 재시도합니다.`);

            // Fallback: 로컬 Docker Desktop 환경용
            const fallbackUrl = "http://host.docker.internal:8080/api/v1";
            try {
                const response = await fetch(`${fallbackUrl}/auth/reissue`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: `refreshToken=${refreshToken}`,
                    },
                })

                const data = await response.json()
                return NextResponse.json(data, { status: 200 });
            } catch (fallbackError) {
                console.error("[Reissue API] Backend Unreachable:", fallbackError)
                return NextResponse.json({ message: "Backend Unreachable" }, { status: 502 })
            }
        }

    } catch (error) {
        console.error("[Reissue API Route] Fatal Error:", error)
        return NextResponse.json(
            { message: "Internal Server Error (Reissue Route)" },
            { status: 500 }
        )
    }
}