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
