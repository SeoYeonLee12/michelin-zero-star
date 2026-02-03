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
    likeCount: number
    nickname: string   // ✅ Backend: nickname
    profileImageUrl?: string // ✅ Backend: profileImageUrl
    totalStar?: number // ✅ Backend: totalStar
    imageUrls: string[]
    createdAt: string
    owner: boolean // Backend: isOwner -> mapped to owner or isOwner depending on usage, backend returns isOwner?
    // Backend returns "isOwner", let's check if we need to map or if JS uses isOwner.
    // The backend field is "isOwner", so JSON will have "isOwner".
    isOwner: boolean
    writerId?: number
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

export async function updatePost(
    postId: string,
    postData: MarketPostUpdateRequest,
    images?: File[]
): Promise<string> {
    const formData = new FormData()

    // 1. Post 정보 (JSON blob)
    const postBlob = new Blob([JSON.stringify(postData)], {
        type: "application/json",
    })
    formData.append("post", postBlob)

    // 2. 이미지 파일들 (선택사항)
    if (images && images.length > 0) {
        images.forEach((file) => {
            formData.append("images", file)
        })
    }

    return apiFetch<string>(`/api/v1/market/posts/${postId}`, {
        method: "PUT",
        body: formData,
    })
}

/**
 * 게시글 좋아요 토글 (좋아요 추가/취소)
 */
export async function toggleLike(postId: string): Promise<string> {
    return apiFetch<string>(`/api/v1/market/posts/${postId}/likes`, {
        method: "POST",
    })
}

export async function deletePost(postId: string): Promise<string> {
    return apiFetch<string>(`/api/v1/market/posts/${postId}`, {
        method: "DELETE",
    })
}

/**
 * 게시글 상태 변경 (거래중 ↔ 거래완료)
 */
export async function updatePostStatus(postId: string, status: "SELLING" | "RESERVED" | "SOLD"): Promise<string> {
    return apiFetch<string>(`/api/v1/market/posts/${postId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    })
}
// ... types

export type PageResponse<T> = {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
    first: boolean
    last: boolean
    empty: boolean
}

// 내가 쓴 게시글 조회 (페이징)
export async function getMyPostList(page = 0, size = 10): Promise<PageResponse<MarketPostListResponse>> {
    return apiFetch<PageResponse<MarketPostListResponse>>(`/api/v1/market/posts/me?page=${page}&size=${size}`)
}

// 내가 찜한 게시글 조회
export async function getLikedPosts(): Promise<MarketPostListResponse[]> {
    return apiFetch<MarketPostListResponse[]>("/api/v1/market/liked")
}
