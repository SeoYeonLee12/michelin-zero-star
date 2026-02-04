// michelin-zero-star\frontend\app\api\v1\auth\reissue\route.ts
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

        // ✅ [핵심 수정] Docker 환경에 맞는 백엔드 주소 설정 로직
        // 1. 환경변수 INTERNAL_API_URL이 있으면 최우선 사용 (docker-compose에서 설정한 값)
        // 2. 없으면 Docker 기본 서비스명인 'backend' 시도
        // 3. 로컬 개발(Docker 아님)일 경우를 대비해 localhost 유지

        let backendUrl = process.env.INTERNAL_API_URL;

        if (!backendUrl) {
            // Docker 환경에서 localhost는 127.0.0.1이 아니라 서비스명을 써야 함
            if (process.env.NEXT_PUBLIC_API_URL?.includes("localhost")) {
                // Docker Compose 서비스명 'backend'를 우선 시도
                backendUrl = "http://backend:8080/api/v1";
            } else {
                backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api/v1";
            }
        }

        // console.log(`[Reissue API] Requesting to: ${backendUrl}/auth/reissue`);

        try {
            const response = await fetch(`${backendUrl}/auth/reissue`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `refreshToken=${refreshToken}`,
                },
            })

            // 응답 처리 (JSON / Text 분기)
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
                cookieStore.delete("refreshToken")
                return NextResponse.json(data, { status: response.status })
            }

            // 쿠키 갱신
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
            // backend:8080 연결 실패 시 host.docker.internal로 재시도 (로컬 Docker Desktop용)
            console.warn(`[Reissue API] 1차 시도 실패 (${backendUrl})... host.docker.internal로 재시도합니다.`);

            const fallbackUrl = "http://host.docker.internal:8080/api/v1";
            const response = await fetch(`${fallbackUrl}/auth/reissue`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `refreshToken=${refreshToken}`,
                },
            })

            const data = await response.json().catch(() => ({ message: "Fallback parsing error" }));
            return NextResponse.json(data, { status: 200 });
        }

    } catch (error) {
        console.error("[Reissue API Route] Fatal Error:", error)
        return NextResponse.json(
            { message: "Internal Server Error (Backend Connection Failed)" },
            { status: 500 }
        )
    }
}