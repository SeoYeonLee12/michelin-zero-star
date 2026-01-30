import { NextRequest, NextResponse } from "next/server";

// 카테고리 (한글명 사용)
const CATEGORIES = ["밥", "반찬", "국물", "면", "디저트", "분식", "샐러드", "음료", "야식&술안주", "기타"];

// Mock Data 생성 (다양한 데이터)
const MOCK_RECIPES = Array.from({ length: 48 }).map((_, i) => {
    const categoryName = CATEGORIES[i % CATEGORIES.length];
    const isChef = i % 2 === 0;

    return {
        recipeId: 48 - i, // ID 역순
        title: isChef
            ? `[셰프] 미슐랭 3스타의 ${categoryName} 레시피 ${48 - i}`
            : `자취생 ${48 - i}호의 초간단 ${categoryName}`,
        mainImageUrl: isChef
            ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
            : "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
        averageRating: parseFloat((Math.random() * 5).toFixed(1)), // 0.0 ~ 5.0
        // cookTime, servings 제거됨
        isScrapped: i % 5 === 0,
        nickName: isChef ? `Gordon Ramsay ${i}` : `User${i}`,
        isMine: false, // API 명세 추가
        category: categoryName, // 필터링용 내부 필드 (한글)
        recipeType: isChef ? "CHEF" : "USER", // 필터링용 내부 필드
        tags: [
            { tag_name: "한식" },
            { tag_name: categoryName }, // 카테고리도 태그로 넣어봄
            { tag_name: isChef ? "전문가" : "간편식" }
        ]
    };
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "0", 10);
    const size = parseInt(searchParams.get("size") || "20", 10);

    const sort = searchParams.get("sort") || "LATEST";
    const recipeType = searchParams.get("recipeType"); // "USER" | "CHEF"
    const category = searchParams.get("category"); // 한글 카테고리명
    const searchWord = searchParams.get("searchWord");

    // 1. 기본 데이터 준비
    let filtered = [...MOCK_RECIPES];

    // 2. RecipeType 필터링
    // (요청에 recipeType이 있으면 해당 타입만, 없으면 전체 or 기본값)
    if (recipeType) {
        if (recipeType === "CHEF") {
            filtered = filtered.filter(r => r.recipeType === "CHEF");
        } else if (recipeType === "USER") {
            filtered = filtered.filter(r => r.recipeType === "USER");
        }
    }

    // 3. Category 필터링 (한글명 일치 여부)
    if (category) {
        filtered = filtered.filter(r => r.category === category);
    }

    // 4. SearchWord 필터링
    if (searchWord) {
        const lowerWord = searchWord.toLowerCase();
        filtered = filtered.filter(r =>
            r.title.toLowerCase().includes(lowerWord) ||
            r.nickName.toLowerCase().includes(lowerWord)
        );
    }

    // 5. 정렬 (Sort)
    if (sort === "RATING") {
        // 별점순 (내림차순)
        filtered.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sort === "TIME") {
        // 조리시간순 (오름차순) -> Mock 데이터엔 없지만 로직상 존재 가능, 혹은 제거
        // 데이터에 cookTime이 없으므로 정렬 불가하거나 별도 처리 필요. 
        // 여기서는 cookTime이 제거되었으므로 TIME 정렬은 무시하거나 ID순으로 대체.
        // 하지만 "TIME"은 가능한 값이므로 요청은 올 수 있음.
        // 임시로 ID순으로 처리 (구현 불가)
        filtered.sort((a, b) => b.recipeId - a.recipeId);
    } else {
        // LATEST (ID 내림차순 - 최신순)
        filtered.sort((a, b) => b.recipeId - a.recipeId);
    }

    // 6. 페이지네이션
    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));

    // page는 0-base (Spring Pageable 호환)
    // 범위 보정은 하지 않고, 요청한 페이지가 범위 밖이면 빈 배열 반환이 일반적
    const start = page * size;
    const end = start + size;

    // filtered에서 불필요한 내부 필드(category, recipeType)를 제외하고 반환해야 하나?
    // User가 명세한 응답 바디엔 category/recipeType이 없으므로 제거해서 보내는게 좋음.
    // 여기서는 단순히 spread로 반환하되, 명세에 없는건 UI에서 무시됨.
    const content = filtered.slice(start, end).map(r => ({
        recipeId: r.recipeId,
        title: r.title,
        mainImageUrl: r.mainImageUrl,
        averageRating: r.averageRating,
        isScrapped: r.isScrapped,
        nickName: r.nickName,
        isMine: r.isMine,
        tags: r.tags
        // cookTime, servings, category, recipeType 제외
    }));

    return NextResponse.json({
        recipes: content,
        pageInfo: {
            currentPage: page + 1, // 프론트엔드 UI는 1-base 사용 중
            size: size,
            totalElements: totalElements,
            totalPages: totalPages,
            hasNext: page < totalPages - 1,
            hasPrevious: page > 0
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const token = request.headers.get("authorization");

        // [Proxy fix] 백엔드 @URL 검증 통과를 위한 Blob URL -> Placeholder URL 변환
        // 실제 운영 환경에서는 별도의 이미지 업로드 API를 통해 URL을 발급받아야 함.
        const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=800&auto=format&fit=crop";

        if (body.mainImageUrl?.startsWith("blob:")) {
            body.mainImageUrl = PLACEHOLDER_IMAGE;
        }

        if (Array.isArray(body.steps)) {
            body.steps = body.steps.map((step: any) => ({
                ...step,
                stepImageUrl: step.stepImageUrl?.startsWith("blob:") ? PLACEHOLDER_IMAGE : step.stepImageUrl
            }));
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
        const targetUrl = `${backendUrl}/api/recipes`;

        console.log(`[Proxy] Forwarding POST to ${targetUrl}`);

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
            console.error(`[Proxy] Backend error body: ${errorText}`);

            // 프론트엔드 apiFetch가 message 필드를 에러 메시지로 사용함
            return NextResponse.json(
                { message: `Backend Error: ${errorText || response.statusText}`, detail: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 201 });

    } catch (error) {
        console.error("[Proxy] Registration request failed:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
