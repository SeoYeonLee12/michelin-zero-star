export interface RecipeStep {
  id: number
  stepNumber: number
  action: string
  description: string
  ingredients: string[]
  tools: string[]
  duration: number // seconds
  imageUrl: string
  tips?: string
}

export interface NutritionInfo {
  protein?: number // grams
  carbs?: number // grams
  fat?: number // grams
  fiber?: number // grams
  sodium?: number // mg
  sugar?: number // grams
}

export interface Recipe {
  id: string
  name: string
  thumbnail: string
  tags: string[]
  image?: string | null
  hashtags?: string[] // Added hashtags field for creator/channel info
  author?: string // Added author field for creator name
  rating?: number // Added rating field for michelin stars
  duration: number // minutes
  difficulty: "초보" | "중급" | "상급"
  servings: number
  calories?: number
  nutrition?: NutritionInfo // Added nutrition field
  description?: string // Added description field for recipe intro
  steps: RecipeStep[]
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  recipes?: Recipe[]
  selectedRecipe?: Recipe
}

// 위치 인증 관련 타입
export interface LocationRequestDto {
  latitude: number
  longitude: number
}

export interface LocationResponseDto {
  message: string
  locationAddress?: string
  locationCode?: string
}

export interface UserLocation {
  latitude: number
  longitude: number
  locationAddress: string
  locationCode: string
  isVerified: boolean
  updatedAt: string
}
