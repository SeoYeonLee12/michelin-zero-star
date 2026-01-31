import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get("authorization");
        const body = await request.json();

        const targetUrl = `${BACKEND_URL}/api/cooking/complete`;

        console.log(`[Proxy] Forwarding Cooking Complete POST to ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": token }),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(`[Proxy] Backend error: ${response.status}`);
            const errorText = await response.text();
            return NextResponse.json(
                { message: "Backend fetch failed", detail: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("[Proxy] Cooking Complete request failed:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
