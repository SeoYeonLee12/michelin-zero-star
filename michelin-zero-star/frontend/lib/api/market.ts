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
    writerId: number // "My Post" 표시용
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
    location: string // 지역 정보
    status: "SELLING" | "RESERVED" | "SOLD"
    chatCount: number
    likeCount: number // 찜 수
    nickname: string // 작성자 닉네임
    profileImageUrl?: string // 작성자 프로필 이미지
    totalStar?: number // 작성자 별점
    imageUrls: string[]
    createdAt: string
    isOwner: boolean // 본인 글 여부
}

export async function getPostDetail(postId: string): Promise<MarketPostDetailResponse> {
    return apiFetch<MarketPostDetailResponse>(`/api/v1/market/posts/${postId}`)
}

export type MarketPostUpdateRequest = {
    title: string
    content: string
    price: number
    meetingPlace: string
}

export async function updatePost(
    postId: string,
    postData: MarketPostUpdateRequest,
    newImages: File[],
    existingImageUrls: string[]
): Promise<string> {
    const formData = new FormData()

    // 1. Post 정보 (JSON)
    const postBlob = new Blob([JSON.stringify(postData)], {
        type: "application/json",
    })
    formData.append("post", postBlob)

    // 2. 새로운 이미지 파일들
    newImages.forEach((file) => {
        formData.append("newImages", file)
    })

    // 3. 유지할 기존 이미지 URL들
    existingImageUrls.forEach((url) => {
        formData.append("existingImages", url)
    })

    return apiFetch<string>(`/api/v1/market/posts/${postId}`, {
        method: "PUT",
        body: formData,
    })
}

export async function updatePostStatus(postId: string, status: "SELLING" | "RESERVED" | "SOLD"): Promise<string> {
    return apiFetch<string>(`/api/v1/market/posts/${postId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    })
}

export async function deletePost(postId: string): Promise<string> {
    return apiFetch<string>(`/api/v1/market/posts/${postId}`, {
        method: "DELETE",
    })
}
