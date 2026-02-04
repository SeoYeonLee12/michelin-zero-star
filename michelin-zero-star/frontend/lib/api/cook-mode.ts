import { apiFetch } from "./client"

interface CookingCompleteRequest {
    recipeId: number
}

interface CookingCompleteResponse {
    cookingLogId: number
    isAwardedCookingCompleteReward: boolean
}

export async function completeCooking(data: CookingCompleteRequest): Promise<CookingCompleteResponse> {
    return await apiFetch<CookingCompleteResponse>("/api/cooking/complete", {
        method: "POST",
        body: JSON.stringify(data),
    })
}
