import { apiFetch } from "./client"

/**
 * Scrap API Response Types
 */
export interface ScrapRecipeItem {
    recipeId: number
    title: string
    mainImageUrl: string
    averageRating: number
    nickName: string
    tags: { tag_name: string }[]
}

export interface ScrappedRecipesResponse {
    recipes: ScrapRecipeItem[]
    pageInfo: {
        currentPage: number
        size: number
        totalElements: number
        totalPages: number
        hasNext: boolean
        hasPrevious: boolean
    }
}

export interface ToggleScrapRequest {
    recipeId: number
}

export interface ToggleScrapResponse {
    isScrapped: boolean
}

/**
 * Get all scrapped recipes for the current user
 * 
 * @returns Paginated list of scrapped recipes
 */
export async function getScrappedRecipes(): Promise<ScrappedRecipesResponse> {
    return apiFetch<ScrappedRecipesResponse>("/api/scraps", {
        method: "GET",
    })
}

/**
 * Toggle scrap status for a recipe (save or unsave)
 * 
 * @param recipeId - Recipe ID to toggle scrap
 * @returns Updated scrap status
 */
export async function toggleScrap(recipeId: number): Promise<ToggleScrapResponse> {
    return apiFetch<ToggleScrapResponse>("/api/scraps", {
        method: "POST",
        body: JSON.stringify({ recipeId }),
    })
}
