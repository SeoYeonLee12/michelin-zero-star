"use client"

import * as React from "react"
import { verifyUserLocation, signup as signupAPI } from "./api"
import { mockVerifyUserLocation } from "./mock-api"
import type { LocationRequestDto } from "./types"

// ✅ 개발 환경에서 mock 사용 여부 (필요 시 false로 변경하여 실제 API 테스트)
const USE_MOCK_API = process.env.NODE_ENV === 'development';

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function storageKey(base: string, userId?: string | null): string {
  return userId ? `${base}:${userId}` : base
}

// --- Interfaces ---
interface User {
  id: string
  name: string
  nickname: string
  email: string
  profileImage?: string
  level: string
  bio: string
  location?: string
  latitude?: number
  longitude?: number
  locationCode?: string
  stars: number
  todayStars: number
  lastStarDate: string
}

interface LikedRecipe {
  id: string
  title: string
  image: string
  author: string
  savedAt: string
}

interface Message {
  id: string
  recipientId: string
  recipientName: string
  recipientAvatar?: string
  content: string
  timestamp: string
  isRead: boolean
  isSentByMe: boolean
}

interface Conversation {
  id: string
  recipientId: string
  recipientName: string
  recipientAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface UserRecipe {
  id: string
  title: string
  description: string
  category: string
  servings: number
  thumbnail: string
  tags: string[]
  ingredients: {
    name: string
    amount: string
  }[]
  steps: {
    id: number
    action: string
    description: string
    duration: number
    imagePreview: string | null
    tips: string
  }[]
  createdAt: string
}

interface UserPost {
  id: string
  title: string
  description: string
  price: string
  image: string
  place: string
  likes: number
  createdAt: string
  status: "available" | "completed"
}

type LikedPost = UserPost & { savedAt: string }

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: { name: string; nickname: string; email: string; password: string }) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => void
  updateLocation: (latitude: number, longitude: number) => Promise<string>
  likedRecipes: LikedRecipe[]
  toggleLikeRecipe: (recipe: LikedRecipe) => void
  isRecipeLiked: (recipeId: string) => boolean
  conversations: Conversation[]
  sendMessage: (recipientId: string, recipientName: string, recipientAvatar: string, content: string) => void
  getMessages: (recipientId: string) => Message[]
  deleteConversation: (recipientId: string) => void
  userRecipes: UserRecipe[]
  addUserRecipe: (recipe: Omit<UserRecipe, "id" | "createdAt">) => string
  updateUserRecipe: (id: string, recipe: Partial<Omit<UserRecipe, "id" | "createdAt">>) => void
  deleteUserRecipe: (id: string) => void
  userPosts: UserPost[]
  addUserPost: (post: Omit<UserPost, "id" | "createdAt" | "status" | "likes">) => void
  updateUserPost: (id: string, post: Partial<Omit<UserPost, "id" | "createdAt">>) => void
  deleteUserPost: (id: string) => void
  likedPosts: LikedPost[]
  toggleLikePost: (postOrEvent: React.MouseEvent | UserPost, maybePost?: UserPost) => void
  isPostLiked: (postId: string) => boolean
  earnStars: (amount: number, reason: "cook" | "recipe") => boolean
  getStarLevel: () => number
  completedRecipes: Set<string>
  markRecipeAsCompleted: (recipeId: string) => void
  reviewedRecipes: Set<string>
  markRecipeAsReviewed: (recipeId: string) => void
  hasUserReviewedRecipe: (recipeId: string) => boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [likedRecipes, setLikedRecipes] = React.useState<LikedRecipe[]>([])
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [messages, setMessages] = React.useState<Message[]>([])
  const [userRecipes, setUserRecipes] = React.useState<UserRecipe[]>([])
  const [userPosts, setUserPosts] = React.useState<UserPost[]>([])
  const [likedPosts, setLikedPosts] = React.useState<LikedPost[]>([])
  const [completedRecipes, setCompletedRecipes] = React.useState<Set<string>>(new Set())
  const [reviewedRecipes, setReviewedRecipes] = React.useState<Set<string>>(new Set())

  // Initial load from storage
  React.useEffect(() => {
    const savedUser = safeJsonParse<User | null>(localStorage.getItem("cooksync_user"), null)
    if (savedUser) setUser(savedUser)

    const savedLikedRecipes = safeJsonParse<LikedRecipe[]>(localStorage.getItem("cooksync_liked_recipes"), [])
    if (savedLikedRecipes.length) setLikedRecipes(savedLikedRecipes)

    const savedConversations = safeJsonParse<Conversation[]>(localStorage.getItem("cooksync_conversations"), [])
    if (savedConversations.length) setConversations(savedConversations)

    const savedMessages = safeJsonParse<Message[]>(localStorage.getItem("cooksync_messages"), [])
    if (savedMessages.length) setMessages(savedMessages)

    const savedUserRecipes = safeJsonParse<UserRecipe[]>(localStorage.getItem("cooksync_user_recipes"), [])
    if (savedUserRecipes.length) setUserRecipes(savedUserRecipes)

    const savedUserPosts = safeJsonParse<UserPost[]>(localStorage.getItem("cooksync_user_posts"), [])
    if (savedUserPosts.length) setUserPosts(savedUserPosts)

    const rawLikedPosts = safeJsonParse<unknown>(localStorage.getItem("cooksync_liked_posts"), [])
    const nowIso = new Date().toISOString()
    let normalizedLikedPosts: LikedPost[] = []

    if (Array.isArray(rawLikedPosts)) {
      if (rawLikedPosts.every((x) => typeof x === "string")) {
        const ids = rawLikedPosts as string[]
        normalizedLikedPosts = ids
          .map((id) => savedUserPosts.find((p) => p.id === id))
          .filter(Boolean)
          .map((p) => ({ ...(p as UserPost), savedAt: nowIso }))
      } else if (rawLikedPosts.every((x) => typeof x === "object" && x !== null)) {
        normalizedLikedPosts = (rawLikedPosts as any[])
          .filter((p) => typeof p.id === "string")
          .map((p) => ({ ...(p as UserPost), savedAt: typeof p.savedAt === "string" ? p.savedAt : nowIso }))
      }
    }
    if (normalizedLikedPosts.length) setLikedPosts(normalizedLikedPosts)

    const userId = savedUser?.id ?? null
    const completedKey = storageKey("cooksync_completed_recipes", userId)
    const reviewedKey = storageKey("cooksync_reviewed_recipes", userId)
    const legacyCompleted = safeJsonParse<string[]>(localStorage.getItem("cooksync_completed_recipes"), [])
    const legacyReviewed = safeJsonParse<string[]>(localStorage.getItem("cooksync_reviewed_recipes"), [])
    const savedCompletedRecipes = safeJsonParse<string[]>(localStorage.getItem(completedKey), legacyCompleted)
    const savedReviewedRecipes = safeJsonParse<string[]>(localStorage.getItem(reviewedKey), legacyReviewed)

    if (savedCompletedRecipes.length) setCompletedRecipes(new Set(savedCompletedRecipes))
    if (savedReviewedRecipes.length) setReviewedRecipes(new Set(savedReviewedRecipes))
  }, [])

  // User-scoped data loading
  React.useEffect(() => {
    const userId = user?.id ?? null
    if (!userId) {
      setCompletedRecipes(new Set())
      setReviewedRecipes(new Set())
      return
    }

    const completedKey = storageKey("cooksync_completed_recipes", userId)
    const reviewedKey = storageKey("cooksync_reviewed_recipes", userId)
    const legacyCompleted = safeJsonParse<string[]>(localStorage.getItem("cooksync_completed_recipes"), [])
    const legacyReviewed = safeJsonParse<string[]>(localStorage.getItem("cooksync_reviewed_recipes"), [])
    const completed = safeJsonParse<string[]>(localStorage.getItem(completedKey), legacyCompleted)
    const reviewed = safeJsonParse<string[]>(localStorage.getItem(reviewedKey), legacyReviewed)

    setCompletedRecipes(new Set(completed))
    setReviewedRecipes(new Set(reviewed))

    if (!localStorage.getItem(completedKey) && legacyCompleted.length) {
      localStorage.setItem(completedKey, JSON.stringify(legacyCompleted))
    }
    if (!localStorage.getItem(reviewedKey) && legacyReviewed.length) {
      localStorage.setItem(reviewedKey, JSON.stringify(legacyReviewed))
    }
  }, [user?.id])

  // --- Auth Actions ---
  const login = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const newUser: User = {
      id: "1",
      name: "김민지",
      nickname: "민지",
      email,
      level: "미슐랭 3스타",
      bio: "매일 조금씩 요리 실력을 키워가고 있어요!",
      location: "대전 서구 둔산동",
      stars: 15,
      todayStars: 0,
      lastStarDate: new Date().toISOString().split("T")[0],
    }
    setUser(newUser)
    localStorage.setItem("cooksync_user", JSON.stringify(newUser))
  }

  const signup = async (data: { name: string; nickname: string; email: string; password: string }) => {
  try {
    const accessToken = await signupAPI({
      name: data.name,
      nickname: data.nickname,
      email: data.email,
      password: data.password,
    })

    // ✅ 토큰 저장 (이후 위치 인증 등에서 사용)
    localStorage.setItem("cooksync_access_token", accessToken)

    // ✅ (선택) 회원가입 직후 로그인 상태로 만들고 싶으면 user 세팅 필요
    // 백엔드에서 유저 정보 안 내려주면 임시로 최소 정보만 넣거나,
    // 가입 후 login API를 다시 호출해서 유저 정보를 가져오는 방식이 더 안전.
    // 일단은 “가입 성공 + 토큰 저장”까지만 처리해도 위치 인증은 가능해짐.

    console.log("✅ 회원가입 성공, accessToken 저장 완료")
  } catch (error) {
    console.error("❌ 회원가입 실패:", error)
    throw error
  }
}

  const logout = () => {
    setUser(null)
    setCompletedRecipes(new Set())
    setReviewedRecipes(new Set())
    localStorage.removeItem("cooksync_user")
  }

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      localStorage.setItem("cooksync_user", JSON.stringify(updatedUser))
    }
  }

  const updateLocation = async (latitude: number, longitude: number): Promise<string> => {
    if (!user) throw new Error("사용자 정보가 없습니다.")

    try {
      const locationData: LocationRequestDto = { latitude, longitude }
      let response

      // ✅ 환경에 따라 Mock과 실제 API 선택
      if (USE_MOCK_API) {
        console.log("🧪 Mock API를 사용하여 위치 인증을 진행합니다.")
        response = await mockVerifyUserLocation(locationData)
      } else {
        const token = localStorage.getItem("cooksync_access_token") || ""
        response = await verifyUserLocation(locationData, token)
      }

      const locationAddress = response.locationAddress || "위치 인증 완료"
      const locationCode = response.locationCode || ""
      
      const updatedUser = {
        ...user,
        location: locationAddress,
        latitude,
        longitude,
        locationCode,
      }
      setUser(updatedUser)
      localStorage.setItem("cooksync_user", JSON.stringify(updatedUser))

      return locationAddress
    } catch (error) {
      console.error("위치 인증 중 오류 발생:", error)
      throw error
    }
  }

  // --- Logic Helpers ---
  const toggleLikeRecipe = (recipe: LikedRecipe) => {
    setLikedRecipes((prev) => {
      const isAlreadyLiked = prev.some((r) => r.id === recipe.id)
      const updated = isAlreadyLiked 
        ? prev.filter((r) => r.id !== recipe.id) 
        : [...prev, { ...recipe, savedAt: new Date().toISOString().split("T")[0].replace(/-/g, ".") }]
      localStorage.setItem("cooksync_liked_recipes", JSON.stringify(updated))
      return updated
    })
  }

  const isRecipeLiked = (recipeId: string) => likedRecipes.some((r) => r.id === recipeId)

  const sendMessage = (recipientId: string, recipientName: string, recipientAvatar: string, content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      recipientId,
      recipientName,
      recipientAvatar,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      isSentByMe: true,
    }

    setMessages((prev) => {
      const updated = [...prev, newMessage]
      localStorage.setItem("cooksync_messages", JSON.stringify(updated))
      return updated
    })

    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c.recipientId === recipientId)
      let updated = [...prev]
      if (existingIndex >= 0) {
        updated[existingIndex] = { ...updated[existingIndex], lastMessage: content, lastMessageTime: new Date().toISOString() }
      } else {
        updated.push({
          id: Date.now().toString(), recipientId, recipientName, recipientAvatar,
          lastMessage: content, lastMessageTime: new Date().toISOString(), unreadCount: 0,
        })
      }
      localStorage.setItem("cooksync_conversations", JSON.stringify(updated))
      return updated
    })
  }

  const getMessages = (recipientId: string) => messages.filter((m) => m.recipientId === recipientId)

  const deleteConversation = (recipientId: string) => {
    setMessages(prev => {
      const updated = prev.filter(m => m.recipientId !== recipientId)
      localStorage.setItem("cooksync_messages", JSON.stringify(updated))
      return updated
    })
    setConversations(prev => {
      const updated = prev.filter(c => c.recipientId !== recipientId)
      localStorage.setItem("cooksync_conversations", JSON.stringify(updated))
      return updated
    })
  }

  const addUserRecipe = (recipe: Omit<UserRecipe, "id" | "createdAt">) => {
    const newId = `user-recipe-${Date.now()}`
    const newRecipe = { ...recipe, id: newId, createdAt: new Date().toISOString() }
    setUserRecipes(prev => {
      const updated = [newRecipe, ...prev]
      localStorage.setItem("cooksync_user_recipes", JSON.stringify(updated))
      return updated
    })
    earnStars(1, "recipe")
    return newId
  }

  const updateUserRecipe = (id: string, recipe: Partial<Omit<UserRecipe, "id" | "createdAt">>) => {
    setUserRecipes(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...recipe } : r)
      localStorage.setItem("cooksync_user_recipes", JSON.stringify(updated))
      return updated
    })
  }

  const deleteUserRecipe = (id: string) => {
    setUserRecipes(prev => {
      const updated = prev.filter(r => r.id !== id)
      localStorage.setItem("cooksync_user_recipes", JSON.stringify(updated))
      return updated
    })
  }

  const addUserPost = (post: Omit<UserPost, "id" | "createdAt" | "status" | "likes">) => {
    const newPost: UserPost = { ...post, id: `user-post-${Date.now()}`, createdAt: new Date().toISOString(), status: "available", likes: 0 }
    setUserPosts(prev => {
      const updated = [newPost, ...prev]
      localStorage.setItem("cooksync_user_posts", JSON.stringify(updated))
      return updated
    })
  }

  const updateUserPost = (id: string, post: Partial<Omit<UserPost, "id" | "createdAt">>) => {
    setUserPosts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...post } : p)
      localStorage.setItem("cooksync_user_posts", JSON.stringify(updated))
      return updated
    })
  }

  const deleteUserPost = (id: string) => {
    setUserPosts(prev => {
      const updated = prev.filter(p => p.id !== id)
      localStorage.setItem("cooksync_user_posts", JSON.stringify(updated))
      return updated
    })
  }

  const toggleLikePost = (postOrEvent: React.MouseEvent | UserPost, maybePost?: UserPost) => {
    if ((postOrEvent as any).stopPropagation) (postOrEvent as React.MouseEvent).stopPropagation()
    const post = (maybePost ?? postOrEvent) as UserPost
    setLikedPosts(prev => {
      const isLiked = prev.some(p => p.id === post.id)
      const updated = isLiked ? prev.filter(p => p.id !== post.id) : [...prev, { ...post, savedAt: new Date().toISOString() }]
      localStorage.setItem("cooksync_liked_posts", JSON.stringify(updated))
      return updated
    })
  }

  const isPostLiked = (postId: string) => likedPosts.some(p => p.id === postId)

  const earnStars = (amount: number, reason: "cook" | "recipe"): boolean => {
    if (!user) return false
    const today = new Date().toISOString().split("T")[0]
    let currentTodayStars = user.lastStarDate !== today ? 0 : user.todayStars
    if (currentTodayStars >= 3) return false
    const actualAmount = Math.min(amount, 3 - currentTodayStars)
    if (actualAmount <= 0) return false
    const updatedUser = { ...user, stars: Math.min(user.stars + actualAmount, 100), todayStars: currentTodayStars + actualAmount, lastStarDate: today }
    setUser(updatedUser)
    localStorage.setItem("cooksync_user", JSON.stringify(updatedUser))
    return true
  }

  const getStarLevel = () => user ? Math.floor(user.stars / 10) : 0

  const markRecipeAsCompleted = React.useCallback((recipeId: string) => {
    if (!user?.id) return
    const key = storageKey("cooksync_completed_recipes", user.id)
    setCompletedRecipes(prev => {
      if (prev.has(recipeId)) return prev
      const updated = new Set(prev).add(recipeId)
      localStorage.setItem(key, JSON.stringify(Array.from(updated)))
      return updated
    })
  }, [user?.id])

  const markRecipeAsReviewed = (recipeId: string) => {
    if (!user?.id) return
    const key = storageKey("cooksync_reviewed_recipes", user.id)
    setReviewedRecipes(prev => {
      const updated = new Set(prev).add(recipeId)
      localStorage.setItem(key, JSON.stringify(Array.from(updated)))
      return updated
    })
  }

  const hasUserReviewedRecipe = (recipeId: string) => reviewedRecipes.has(recipeId)

  return (
    <AuthContext.Provider
      value={{
        user, isLoggedIn: !!user, login, signup, logout, updateProfile, updateLocation,
        likedRecipes, toggleLikeRecipe, isRecipeLiked, conversations, sendMessage, getMessages,
        deleteConversation, userRecipes, addUserRecipe, updateUserRecipe, deleteUserRecipe,
        userPosts, addUserPost, updateUserPost, deleteUserPost, likedPosts, toggleLikePost,
        isPostLiked, earnStars, getStarLevel, completedRecipes, markRecipeAsCompleted,
        reviewedRecipes, markRecipeAsReviewed, hasUserReviewedRecipe,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return context
}