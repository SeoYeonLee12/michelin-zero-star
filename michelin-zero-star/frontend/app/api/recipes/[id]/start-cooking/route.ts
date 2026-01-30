import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const token = request.headers.get("authorization");

        // Note: The frontend route is /start-cooking, but it calls the backend /cooking endpoint
        const targetUrl = `${BACKEND_URL}/api/recipes/${id}/cooking`;

        console.log(`[Proxy] Forwarding Start Cooking GET to ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": token }),
            },
        });

        if (!response.ok) {
            console.error(`[Proxy] Backend error: ${response.status}`);
            const errorText = await response.text();

            // Helpful debug information for 404
            if (response.status === 404) {
                console.error(`[Proxy] The backend endpoint ${targetUrl} was not found.`);
            }

            return NextResponse.json(
                { message: "Backend fetch failed", detail: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("[Proxy] Start Cooking Mode request failed:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
