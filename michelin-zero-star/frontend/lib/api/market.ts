import { apiFetch } from "./client"

export type MarketPostCreateRequest = {
    title: string
    content: string
    price: number
    meetingPlace?: string
    category?: string
}

export type MarketPostResponse = string // API 명세에 따르면 "string" 반환

// 프론트 Community -> 백엔드 Market
export async function createPost(
    postData: MarketPostCreateRequest,
    images: File[]
): Promise<MarketPostResponse> {
    const formData = new FormData()

    // 1. Post 정보 (JSON)
    const postBlob = new Blob([JSON.stringify(postData)], {
        type: "application/json",
    })
    formData.append("post", postBlob)

    // 2. 이미지 파일들
    images.forEach((file) => {
        formData.append("images", file)
    })

    return apiFetch<MarketPostResponse>("/api/v1/market/posts", {
        method: "POST",
        body: formData,
    })
}

export type MarketPostListResponse = {
    id: number
    title: string
    price: number
    location: string
    thumbnailUrl: string
    timeAgo: string
    status: string
    chatCount: number
}

// 전체 게시글 조회
export async function getPostList(): Promise<MarketPostListResponse[]> {
    return apiFetch<MarketPostListResponse[]>("/api/v1/market/posts")
}

// 주변 게시글 조회
export async function getNearbyPosts(km = 5): Promise<MarketPostListResponse[]> {
    return apiFetch<MarketPostListResponse[]>(`/api/v1/market/posts/nearby?km=${km}`)
}

export type MarketPostDetailResponse = {
    id: number
    title: string
    content: string
    price: number
    meetingPlace: string
    location: string
    status: string
    chatCount: number
    writerNickname: string
    imageUrls: string[]
    createdAt: string
    owner: boolean
    writerId?: number // Detail에도 writerId가 있으면 좋지만 owner가 있으니 필수 아님, 하지만 일관성 위해 추가 가능 (백엔드 확인 필요)
    // 백엔드 Detail DTO를 확인하지 않았지만 owner 필드가 있음.
}

export async function getPostDetail(postId: string): Promise<MarketPostDetailResponse> {
    return apiFetch<MarketPostDetailResponse>(`/api/v1/market/posts/${postId}`)
}

export type MarketPostUpdateRequest = {
    title: string
    content: string
    price: number
    meetingPlace: string
    category?: string  // ✅ 백엔드 필수 검증 통과용
}

export async function updatePost(postId: string, data: MarketPostUpdateRequest): Promise<string> {
    return apiFetch<string>(`/api/v1/market/posts/${postId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function deletePost(postId: string): Promise<string> {
    return apiFetch<string>(`/api/v1/market/posts/${postId}`, {
        method: "DELETE",
    })
}
