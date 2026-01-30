import { NextRequest, NextResponse } from "next/server";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=800&auto=format&fit=crop";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const token = request.headers.get("authorization");

        const targetUrl = `${BACKEND_URL}/api/recipes/${id}`;

        console.log(`[Proxy] Forwarding GET to ${targetUrl}`);

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
            console.error(`[Proxy] Backend error body: ${errorText}`);
            return NextResponse.json(
                { message: "Backend fetch failed", detail: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("[Proxy] Detail request failed:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const body = await request.json();
        const token = request.headers.get("authorization");

        // [Proxy fix] Blob URL 처리
        if (body.mainImageUrl?.startsWith("blob:")) {
            body.mainImageUrl = PLACEHOLDER_IMAGE;
        }

        if (Array.isArray(body.steps)) {
            body.steps = body.steps.map((step: any) => ({
                ...step,
                stepImageUrl: step.stepImageUrl?.startsWith("blob:") ? PLACEHOLDER_IMAGE : step.stepImageUrl
            }));
        }

        const targetUrl = `${BACKEND_URL}/api/recipes/${id}`;

        console.log(`[Proxy] Forwarding PUT to ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": token }),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(`[Proxy] Backend error: ${response.status}`);
            const errorText = await response.text();
            console.error(`[Proxy] Backend error body: ${errorText}`);
            return NextResponse.json(
                { message: `Backend Error: ${errorText || response.statusText}`, detail: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("[Proxy] Update request failed:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const token = request.headers.get("authorization");

        const targetUrl = `${BACKEND_URL}/api/recipes/${id}`;

        console.log(`[Proxy] Forwarding DELETE to ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: "DELETE",
            headers: {
                ...(token && { "Authorization": token }),
            },
        });

        if (!response.ok) {
            console.error(`[Proxy] Backend error: ${response.status}`);
            const errorText = await response.text();
            return NextResponse.json(
                { message: "Backend delete failed", detail: errorText },
                { status: response.status }
            );
        }

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("[Proxy] Delete request failed:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
