"use client"

import * as React from "react"
import type { LocationRequestDto } from "./types"
import { getMe, updateProfile as updateProfileAPI, withdrawUser } from "./api/user"
import { login as loginAPI, signup as signupAPI, logout as logoutAPI } from "./api/auth"
import { verifyLocation } from "./api/user"
import { setCookie, getCookie, removeCookie } from "./cookie"
import { setGlobalAccessToken, getGlobalAccessToken } from "./api/client" // ✅ Import
import { refreshAccessToken } from "./api/auth" // ✅ Import

// ✅ 개발 환경에서 mock 사용 여부
const USE_MOCK_API = false
const FIXED_LATITUDE = 36.3549777
const FIXED_LONGITUDE = 127.2983403

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
  isLoading: boolean // ✅ Added
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: { name: string; nickname: string; email: string; password: string }) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User> & { currentPassword?: string; newPassword?: string; newPasswordConfirm?: string }) => Promise<void>
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
  withdraw: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("[AuthProvider] render")
  const [isLoading, setIsLoading] = React.useState(true) // ✅ Added
  const [user, setUser] = React.useState<User | null>(null)

  const [likedRecipes, setLikedRecipes] = React.useState<LikedRecipe[]>([])
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [messages, setMessages] = React.useState<Message[]>([])
  const [userRecipes, setUserRecipes] = React.useState<UserRecipe[]>([])
  const [userPosts, setUserPosts] = React.useState<UserPost[]>([])
  const [likedPosts, setLikedPosts] = React.useState<LikedPost[]>([])
  const [completedRecipes, setCompletedRecipes] = React.useState<Set<string>>(new Set())
  const [reviewedRecipes, setReviewedRecipes] = React.useState<Set<string>>(new Set())

  // ✅ Prevent double-execution in Strict Mode (Token Rotation Safety)
  const isAuthInitialized = React.useRef(false)

  // Initial load from storage & Silent Refresh
  React.useEffect(() => {
    console.log("[AuthProvider] useEffect start")

    // 1. LocalStorage에서 사용자 정보(껍데기) 복구 (Synchronous)
    const savedUserRaw = localStorage.getItem("cooksync_user")
    const savedUser = safeJsonParse<User | null>(savedUserRaw, null)
    if (savedUser) {
      setUser(savedUser)
    }

    const initAuth = async () => {
      // 0. Cleanup Legacy Data (User confusion prevention)
      localStorage.removeItem("cooksync_access_token")

      // 2. Silent Refresh 시도 (쿠키에 있는 리프레시 토큰으로 액세스 토큰 발급)
      try {
        console.log("[AuthProvider] Attempting Silent Login...")
        const refreshRes = await refreshAccessToken() // ✅ Refreshed Token

        // 성공 시: 메모리에 액세스 토큰 설정
        setGlobalAccessToken(refreshRes.accessToken)
        console.log("[AuthProvider] Silent Login Success")
        // 3. 최신 유저 정보 동기화 하하하
        // 3. 최신 유저 정보 동기화 하하하
        const me = await getMe()
        const recoveredUser: User = {
          id: String(me.id),
          name: me.name ?? "",
          nickname: me.nickname ?? "",
          email: me.email ?? (savedUser?.email ?? ""),
          profileImage: me.profileImage,
          level: me.level ?? "",
          bio: me.bio ?? "",
          location: me.location,
          latitude: me.latitude,
          longitude: me.longitude,
          locationCode: me.locationCode,
          stars: me.stars ?? 0,
          todayStars: me.todayStars ?? 0,
          lastStarDate: me.lastStarDate ?? new Date().toISOString().split("T")[0],
        }
        setUser(recoveredUser)
        localStorage.setItem("cooksync_user", JSON.stringify(recoveredUser))

      } catch (error) {
        console.warn("[AuthProvider] Silent Login Failed (No valid session):", error)
        // 세션 만료됨 -> 로그아웃 처리
        setUser(null)
        setGlobalAccessToken(null)
        localStorage.removeItem("cooksync_user")
        // 쿠키는 JS에서 삭제 불가(HttpOnly)하므로 놔둠 (서버가 401 줄 것임)
      } finally {
        setIsLoading(false) // ✅ Loading Finished
      }
    }

    // ✅ Run only once
    if (!isAuthInitialized.current) {
      isAuthInitialized.current = true
      initAuth()
    }

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
    // 1. 로그인 요청
    const tokenRes = await loginAPI({ email, password })

    // 2. 액세스 토큰을 메모리에 저장 (쿠키 저장 X)
    setGlobalAccessToken(tokenRes.accessToken)

    // 참고: 리프레시 토큰은 백엔드가 Set-Cookie 헤더로(HttpOnly) 설정해주어야 함.

    const me = await getMe()

    const newUser: User = {
      id: String(me.id),
      name: me.name ?? "",
      nickname: me.nickname ?? "",
      email: me.email ?? email,
      profileImage: me.profileImage,
      level: me.level ?? "",
      bio: me.bio ?? "",
      location: me.location,
      latitude: me.latitude,
      longitude: me.longitude,
      locationCode: me.locationCode,
      stars: me.stars ?? 0,
      todayStars: me.todayStars ?? 0,
      lastStarDate: me.lastStarDate ?? new Date().toISOString().split("T")[0],
    }

    setUser(newUser)
    localStorage.setItem("cooksync_user", JSON.stringify(newUser))
  }

  const signup = async (data: { name: string; nickname: string; email: string; password: string }) => {
    try {
      // 1. 회원가입 API 호출 (백엔드는 성공 메시지 문자열만 반환)
      await signupAPI({
        name: data.name,
        nickname: data.nickname,
        email: data.email,
        password: data.password,
      })

      console.log("✅ 회원가입 성공. 자동 로그인을 진행합니다.")

      // 2. 로그인 API 호출 (여기서 진짜 토큰을 받아오고 유저 상태를 갱신함)
      await login(data.email, data.password)

    } catch (error) {
      console.error("❌ 회원가입/로그인 실패:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await logoutAPI() // 서버 쿠키 삭제 요청
    } catch (error) {
      console.error("로그아웃 실패 (토큰 만료 가능성):", error)
    } finally {
      setUser(null)
      setGlobalAccessToken(null) // 메모리 토큰 삭제
      setCompletedRecipes(new Set())
      setReviewedRecipes(new Set())
      localStorage.removeItem("cooksync_user")
      // 쿠키 삭제는 서버 응답에 맡김 (HttpOnly)
    }
  }

  const updateProfile = async (data: Partial<User> & { currentPassword?: string; newPassword?: string; newPasswordConfirm?: string }) => {
    if (user) {
      try {
        // Only send fields that actually changed
        const updatePayload: any = {}
        if (data.nickname && data.nickname !== user.nickname) {
          updatePayload.nickname = data.nickname
        }
        if (data.currentPassword) updatePayload.currentPassword = data.currentPassword
        if (data.newPassword) updatePayload.newPassword = data.newPassword
        if (data.newPasswordConfirm) updatePayload.newPasswordConfirm = data.newPasswordConfirm

        await updateProfileAPI(updatePayload)
        const { currentPassword, newPassword, newPasswordConfirm, ...safeData } = data
        const updatedUser = { ...user, ...safeData }
        setUser(updatedUser)
        localStorage.setItem("cooksync_user", JSON.stringify(updatedUser))

      } catch (error) {
        console.error("프로필 수정 실패:", error)
        throw error
      }
    }
  }

  const updateLocation = async (latitude: number, longitude: number): Promise<string> => {
    if (!user) throw new Error("사용자 정보가 없습니다.")

    // ✅ 변경: 쿠키 대신 메모리 토큰 확인 (혹은 isLoggedIn 확인)
    const token = getGlobalAccessToken()
    if (!token) throw new Error("토큰이 없습니다. 다시 로그인 해주세요.")

    const fixedLocationData: LocationRequestDto = {
      latitude: FIXED_LATITUDE,
      longitude: FIXED_LONGITUDE,
    }

    const res = await verifyLocation(fixedLocationData)

    let locationAddress = typeof res === "string" ? res : res.locationAddress ?? res.message ?? "위치 인증 완료"
    const match = locationAddress.match(/'([^']+)'/)
    if (match && match[1]) {
      locationAddress = match[1]
    }

    const locationCode = typeof res === "string" ? "" : res.locationCode ?? ""

    const updatedUser = {
      ...user,
      location: locationAddress,
      latitude: FIXED_LATITUDE,
      longitude: FIXED_LONGITUDE,
      locationCode,
    }

    setUser(updatedUser)
    localStorage.setItem("cooksync_user", JSON.stringify(updatedUser))

    return locationAddress
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

  const withdraw = async () => {
    try {
      await withdrawUser()
      logout()
      alert("회원 탈퇴가 완료되었습니다.")
    } catch (error) {
      console.error("회원 탈퇴 실패:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading, // ✅ Added
        user, isLoggedIn: !!user, login, signup, logout, updateProfile, updateLocation,
        likedRecipes, toggleLikeRecipe, isRecipeLiked, conversations, sendMessage, getMessages,
        deleteConversation, userRecipes, addUserRecipe, updateUserRecipe, deleteUserRecipe,
        userPosts, addUserPost, updateUserPost, deleteUserPost, likedPosts, toggleLikePost,
        isPostLiked, earnStars, getStarLevel, completedRecipes, markRecipeAsCompleted,
        reviewedRecipes, markRecipeAsReviewed, hasUserReviewedRecipe, withdraw,
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