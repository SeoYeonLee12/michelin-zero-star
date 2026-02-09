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
  carbohydrate?: number // grams
  carbs?: number // grams (legacy)
  fat?: number // grams (saturated fat)
  sodium?: number // mg
  cholesterol?: number // mg
  calcium?: number // mg
  fiber?: number // grams
  sugar?: number // grams
}

export interface Ingredient {
  name: string
  amount: string
}

export interface Author {
  name: string
  image?: string
  isFollowing?: boolean
  totalStars?: number
}

export interface Recipe {
  id: string
  name: string
  thumbnail: string
  tags: string[]
  image?: string | null
  recipeType?: string // Added to distinguish USER vs CHEF recipes
  hashtags?: string[] // Added hashtags field for creator/channel info
  author?: string | Author // Support both string and object
  rating?: number // Legacy field for michelin stars
  averageRating?: number // Average rating from backend API
  duration: number // minutes from cookTime (or seconds from API)
  difficulty: "초보" | "중급" | "상급" | string
  servings: number
  calories?: number // Legacy field name
  calorie?: number // Backend API field name
  nutrition?: NutritionInfo // Added nutrition field
  description?: string // Added description field for recipe intro
  steps: RecipeStep[]
  ingredients?: Ingredient[] // Top-level ingredients
  isLiked?: boolean
  isMine?: boolean
  createdAt?: string
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
