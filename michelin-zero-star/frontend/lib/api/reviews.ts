import { apiFetch } from "./client"

/**
 * Review API Response Types
 */
export interface CreateReviewRequest {
    recipeId: number
    rating: number
    content: string
}

export interface CreateReviewResponse {
    recipeId: number
}

// Correct Review interface matching backend ReviewListResponse DTO
export interface Review {
    userId: number
    nickName: string
    userProfileImage: string | null
    reviewId: number
    reviewCreateDate: string
    rating: number
    content: string
    isMine: boolean
    totalStar: number
}

export interface PageInfo {
    currentPage: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
}

export interface ReviewListResponse {
    reviews: Review[]
    pageInfo: PageInfo
}

/**
 * Register a review for a completed recipe
 * 
 * @param data - Review data including recipeId, rating, and content
 * @returns Response containing recipeId
 */
export async function createReview(data: CreateReviewRequest): Promise<CreateReviewResponse> {
    return apiFetch<CreateReviewResponse>("/api/reviews", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

/**
 * Get a list of reviews for a specific recipe.
 * 
 * @param recipeId - The ID of the recipe to get reviews for.
 * @param page - The page number for pagination (defaults to 1).
 * @param size - The number of items per page (defaults to 20).
 * @returns Response containing a list of reviews.
 */
export async function getRecipeReviews(recipeId: number, page: number = 1, size: number = 20): Promise<ReviewListResponse> {
    const apiPage = Math.max(0, page - 1)
    return apiFetch<ReviewListResponse>(`/api/recipes/${recipeId}/reviews?page=${apiPage}&size=${size}`)
}
