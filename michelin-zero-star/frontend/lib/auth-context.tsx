"use client"

import * as React from "react"
import { Client, IMessage } from "@stomp/stompjs" // Incoming
import { getMe, updateProfile as updateProfileAPI, withdrawUser, verifyLocation, type UpdateProfileRequest } from "./api/user" // Combined
import { login as loginAPI, signup as signupAPI, logout as logoutAPI, refreshAccessToken } from "./api/auth" // Combined
import { setGlobalAccessToken, getGlobalAccessToken } from "./api/client" // HEAD
import { setCookie, getCookie, removeCookie } from "./cookie" // HEAD
import {
  getChatRooms,
  getChatMessages,
  createOrEnterChatRoom,
  leaveChatRoom,
  type ChatRoomDto,
  type ChatMessageDto
} from "./api/chat" // Incoming
import { toast } from "@/components/ui/use-toast" // Incoming

// ✅ 개발 환경에서 mock 사용 여부
const USE_MOCK_API = false
// 🔧 고정 좌표 설정 (학하동)
const FIXED_LATITUDE = 36.3549777
const FIXED_LONGITUDE = 127.2983403

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

const storageKey = (key: string, userId: string | null) => (userId ? `${key}_${userId}` : key)

// --- Interfaces ---

interface User {
  id: string
  name: string
  nickname: string
  email: string
  profileImageUrl?: string // Used by some local logic
  profileImage?: string    // Used by new API
  level: string
  bio: string
  location?: string
  latitude?: number
  longitude?: number
  locationCode?: string
  stars: number
  totalStar: number
  todayStars: number
  lastStarDate: string
  categories?: string[]
  isVerified?: boolean
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
  roomId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isRead: boolean
  isSentByMe: boolean
  imageUrl?: string // Added for chat
  // Legacy support fields (optional)
  recipientId?: string
  recipientName?: string
  recipientAvatar?: string
}

interface Conversation {
  id: string
  recipientId: string
  recipientName: string
  recipientAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  postTitle?: string
  postThumbnail?: string
}

interface UserRecipe {
  id: string
  title: string
  description: string
  category?: string
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
  // Common
  isLoading: boolean
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: { name: string; nickname: string; email: string; password: string }) => Promise<void>
  logout: () => void
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  updateLocation: (latitude: number, longitude: number) => Promise<string>
  withdraw: () => Promise<void>

  // Chat (WebSocket + Remote)
  conversations: Conversation[]
  currentMessages: Message[]
  enterChatRoom: (roomId: string) => Promise<void>
  exitChatRoom: () => void
  startChatFromPost: (postId: number) => Promise<string>
  sendMessage: (roomId: string, content: string) => void
  deleteConversation: (roomId: string) => Promise<void>
  getMessages: (recipientId: string) => Message[] // Legacy support signature

  // Local Data (Recipes, Posts, Stars)
  likedRecipes: LikedRecipe[]
  toggleLikeRecipe: (recipe: LikedRecipe) => void
  isRecipeLiked: (recipeId: string) => boolean
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
  console.log("[AuthProvider] render")
  const [isLoading, setIsLoading] = React.useState(true)
  const [user, setUser] = React.useState<User | null>(null)

  // Chat State
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [currentMessages, setCurrentMessages] = React.useState<Message[]>([])
  const stompClient = React.useRef<Client | null>(null)
  const subscriptions = React.useRef<Map<string, any>>(new Map())
  const isAuthInitialized = React.useRef(false)
  const currentRoomIdRef = React.useRef<string | null>(null)

  // Local Data State
  const [likedRecipes, setLikedRecipes] = React.useState<LikedRecipe[]>([])
  const [userRecipes, setUserRecipes] = React.useState<UserRecipe[]>([])
  const [userPosts, setUserPosts] = React.useState<UserPost[]>([])
  const [likedPosts, setLikedPosts] = React.useState<LikedPost[]>([])
  const [completedRecipes, setCompletedRecipes] = React.useState<Set<string>>(new Set())
  const [reviewedRecipes, setReviewedRecipes] = React.useState<Set<string>>(new Set())
  const [messages, setMessages] = React.useState<Message[]>([]) // Legacy local messages

  // 🛠️ 1. 내 ID 판별 함수 (String 비교로 엄격하게 관리)
  const getCurrentUserId = (): string | null => {
    const savedUserRaw = sessionStorage.getItem("cooksync_user")
    if (savedUserRaw) {
      try { return String(JSON.parse(savedUserRaw).id); } catch { return null; }
    }
    return user?.id ? String(user.id) : null;
  }

  // --- WebSocket Logic ---

  const sendReadSignal = (roomId: string) => {
    const myId = getCurrentUserId();
    const token = getGlobalAccessToken();
    if (!stompClient.current?.connected || !token || !myId) return;

    console.log(`👀 [SendRead] Room=${roomId}, MyID=${myId}`);
    stompClient.current.publish({
      destination: "/pub/chat/read",
      body: JSON.stringify({ roomId: Number(roomId), readerId: Number(myId) }),
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  const subscribeToRoom = (roomId: string) => {
    if (!stompClient.current?.connected) return;

    // 이미 구독 중이라면 해제 후 재구독 (중복 방지)
    if (subscriptions.current.has(roomId)) {
      subscriptions.current.get(roomId).unsubscribe();
      subscriptions.current.delete(roomId);
    }

    const myId = getCurrentUserId();
    console.log(`📡 [Subscribe] Room ${roomId} Start. MyID=${myId}`);

    const msgSub = stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message: IMessage) => {
      const body = JSON.parse(message.body) as ChatMessageDto;
      const isCurrentRoom = String(currentRoomIdRef.current) === String(roomId);

      if (isCurrentRoom) {
        const msgSenderId = String(body.senderId);
        const isMe = myId === msgSenderId;

        const newMsg: Message = {
          id: String(body.messageId),
          roomId: roomId,
          senderId: msgSenderId,
          senderName: body.senderNickname,
          content: body.content,
          imageUrl: body.imageUrl,
          timestamp: body.sendTime,
          isRead: body.read,
          isSentByMe: isMe
        }

        setCurrentMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(newMsg.id))) return prev;

          // 임시 메시지 대체 (중복 방지 및 깜빡임 최소화)
          const tempIndex = prev.findIndex(m => m.isSentByMe && m.content.trim() === newMsg.content.trim() && String(m.id).startsWith("temp-"));
          if (tempIndex !== -1) {
            console.log(`🔄 [Replace] TempMsg -> ServerMsg: ${newMsg.id}`);
            const newArr = [...prev];
            newArr[tempIndex] = newMsg;
            return newArr;
          }
          return [...prev, newMsg];
        });

        // 내가 보낸 게 아니고, 화면이 보고 있다면 읽음 처리
        if (!isMe && document.visibilityState === "visible") {
          sendReadSignal(roomId);
        }
      }

      // 대화 목록 업데이트 (마지막 메시지 등)
      setConversations(prev => prev.map(c => {
        if (c.id === roomId) {
          const isViewing = String(currentRoomIdRef.current) === String(roomId);
          return {
            ...c,
            lastMessage: body.content,
            lastMessageTime: body.sendTime,
            // 보고 있으면 0, 아니면 +1 (Global Topic과 겹치지 않게 주의하지만, Current Room 구독은 Active Room일 때만 하므로 안전)
            unreadCount: isViewing ? 0 : c.unreadCount + 1
          };
        }
        return c;
      }))
    });

    const readSub = stompClient.current.subscribe(`/sub/chat/room/${roomId}/read`, (message: IMessage) => {
      try {
        const body = JSON.parse(message.body);
        const readerId = String(body.readerId);
        const myIdInSub = getCurrentUserId(); // Closure 안에서 최신값 get

        console.log(`📖 [ReadRecv] Room=${body.roomId}, Reader=${readerId}, MyID=${myIdInSub}`);

        // 🛠️ 3. 본인의 읽음 신호 무시: 상대방이 읽었을 때만 '1' 제거
        if (String(currentRoomIdRef.current) === String(body.roomId)) {
          if (readerId !== myIdInSub) {
            console.log("✅ Opponent Read -> Marking messages as read.");
            setCurrentMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
          } else {
            console.log("🚫 My Read Signal -> Ignoring UI update.");
          }
        }
      } catch (e) { console.error(e); }
    });

    subscriptions.current.set(roomId, { unsubscribe: () => { msgSub.unsubscribe(); readSub.unsubscribe(); subscriptions.current.delete(roomId); } });
  }

  // 🛠️ 4. 실시간 알림 로직 (다른 화면에서도 즉시 뱃지 업데이트)
  const subscribeToUserTopic = () => {
    if (!stompClient.current?.connected || subscriptions.current.has("user-global")) return;
    const myId = getCurrentUserId();
    if (!myId) return;

    console.log(`🔔 [Subscribe-Global] User Topic: /sub/chat/user/${myId}`);

    const sub = stompClient.current.subscribe(`/sub/chat/user/${myId}`, (message: IMessage) => {
      const body = JSON.parse(message.body) as ChatMessageDto;
      const roomId = String(body.roomId);

      // 현재 보고 있는 방이 '아닐 때'만 처리
      // (보고 있는 방은 subscribeToRoom에서 처리함)
      if (String(currentRoomIdRef.current) !== roomId) {
        console.log(`🔔 [Global-Notif] Msg for Room ${roomId}`);

        toast({
          title: `${body.senderNickname}님의 메시지`,
          description: body.content.length > 20 ? body.content.substring(0, 20) + "..." : body.content,
        });

        setConversations(prev => {
          const exists = prev.some(c => c.id === roomId);
          if (!exists) { fetchConversations(); return prev; }

          return prev.map(c => c.id === roomId ? {
            ...c,
            unreadCount: c.unreadCount + 1, // 여기서만 증가
            lastMessage: body.content,
            lastMessageTime: body.sendTime
          } : c);
        });
      } else {
        console.log(`🔕 [Global-Notif] Ignored because user is in Room ${roomId}`);
      }
    });
    subscriptions.current.set("user-global", sub);
  }

  const fetchConversations = async () => {
    try {
      const rooms = await getChatRooms()
      const mapped = rooms.map(r => ({
        id: String(r.chatRoomId),
        recipientId: String(r.otherUserId),
        recipientName: r.otherUserNickname,
        recipientAvatar: r.otherUserProfileImage,
        lastMessage: r.lastMessage || "대화가 시작되었습니다.",
        lastMessageTime: r.lastMessageAt,
        unreadCount: r.unreadCount || 0
      }));
      // 중복 제거 (Backend issue guard)
      const unique = Array.from(new Map(mapped.map(item => [item.id, item])).values());
      setConversations(unique);
    } catch (error) { console.error(error); }
  }

  const connectWebSocket = (token: string) => {
    if (stompClient.current) disconnectWebSocket();

    // WS URL 동적 생성
    const getWsUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_WS_URL
      if (envUrl) return envUrl

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      let baseUrl = apiBase || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080")

      if (baseUrl.startsWith("http://")) {
        baseUrl = baseUrl.replace("http://", "ws://")
      } else if (baseUrl.startsWith("https://")) {
        baseUrl = baseUrl.replace("https://", "wss://")
      } else if (baseUrl.startsWith("/")) {
        baseUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + baseUrl
      } else if (!baseUrl.startsWith("ws://") && !baseUrl.startsWith("wss://")) {
        baseUrl = "ws://" + baseUrl
      }

      if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1)
      return `${baseUrl}/ws-stomp`
    }

    const wsUrl = getWsUrl()
    console.log("🔌 Connecting WebSocket to:", wsUrl);

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("🟢 WebSocket Connected!");
        subscribeToUserTopic();
        fetchConversations();

        // 재연결 시 현재 방이 있다면 다시 구독
        if (currentRoomIdRef.current) {
          subscribeToRoom(currentRoomIdRef.current);
        }
      },
      onDisconnect: () => {
        console.log("🔴 WebSocket Disconnected");
      }
    })
    client.activate();
    stompClient.current = client;
  }

  const disconnectWebSocket = () => {
    if (stompClient.current) { stompClient.current.deactivate(); stompClient.current = null; }
    subscriptions.current.forEach(sub => sub.unsubscribe?.());
    subscriptions.current.clear();
  }

  // --- Initialization & Auth helpers ---

  const updateUserStruct = (me: any) => {
    const newUser: User = {
      id: String(me.id),
      name: me.name ?? "",
      nickname: me.nickname ?? "",
      email: me.email ?? "",
      profileImageUrl: me.profileImageUrl,
      profileImage: me.profileImage ?? me.profileImageUrl,
      level: me.level ?? "",
      bio: me.bio ?? "",
      location: me.location,
      latitude: me.latitude,
      longitude: me.longitude,
      locationCode: me.locationCode,
      stars: me.stars ?? (me as any).stars ?? 0,
      totalStar: me.totalStar ?? (me as any).total_star ?? 0,
      todayStars: me.todayStars ?? (me as any).today_stars ?? 0,
      lastStarDate: me.lastStarDate ?? (me as any).last_star_date ?? new Date().toISOString().split("T")[0],
    }
    setUser(newUser)
    sessionStorage.setItem("cooksync_user", JSON.stringify(newUser))
    return newUser
  }

  // Initialization Effect
  React.useEffect(() => {
    const savedUserRaw = sessionStorage.getItem("cooksync_user")
    if (savedUserRaw) setUser(JSON.parse(savedUserRaw))

    const initAuth = async () => {
      try {
        const refreshRes = await refreshAccessToken()
        setGlobalAccessToken(refreshRes.accessToken)
        const me = await getMe()
        updateUserStruct(me)
        connectWebSocket(refreshRes.accessToken)
      } catch (error) {
        // Token stale, logout
        setUser(null); setGlobalAccessToken(null); sessionStorage.removeItem("cooksync_user");
      } finally { setIsLoading(false) }
    }

    if (!isAuthInitialized.current) { isAuthInitialized.current = true; initAuth(); }

    const handleRefresh = (e: any) => {
      const newToken = e.detail?.token;
      if (newToken) connectWebSocket(newToken);
    };
    if (typeof window !== 'undefined') window.addEventListener("cooksync:token-refreshed", handleRefresh);

    return () => {
      disconnectWebSocket();
      if (typeof window !== 'undefined') window.removeEventListener("cooksync:token-refreshed", handleRefresh);
    };
  }, [])

  // User Data Effect (Local Logic)
  React.useEffect(() => {
    const userId = user?.id ?? null
    if (!userId) {
      setCompletedRecipes(new Set())
      setReviewedRecipes(new Set())
      setLikedRecipes([])
      setUserRecipes([])
      setUserPosts([])
      setLikedPosts([])
      return
    }

    const completedKey = storageKey("cooksync_completed_recipes", userId)
    const reviewedKey = storageKey("cooksync_reviewed_recipes", userId)
    const likedRecipesKey = storageKey("cooksync_liked_recipes", userId)
    const userRecipesKey = storageKey("cooksync_user_recipes", userId)
    const userPostsKey = storageKey("cooksync_user_posts", userId)
    const likedPostsKey = storageKey("cooksync_liked_posts", userId)

    const legacyCompleted = safeJsonParse<string[]>(localStorage.getItem("cooksync_completed_recipes"), [])
    const legacyReviewed = safeJsonParse<string[]>(localStorage.getItem("cooksync_reviewed_recipes"), [])
    const completed = safeJsonParse<string[]>(localStorage.getItem(completedKey), legacyCompleted)
    const reviewed = safeJsonParse<string[]>(localStorage.getItem(reviewedKey), legacyReviewed)

    setCompletedRecipes(new Set(completed))
    setReviewedRecipes(new Set(reviewed))

    if (localStorage.getItem(likedRecipesKey)) setLikedRecipes(safeJsonParse<LikedRecipe[]>(localStorage.getItem(likedRecipesKey), []))
    if (localStorage.getItem(userRecipesKey)) setUserRecipes(safeJsonParse<UserRecipe[]>(localStorage.getItem(userRecipesKey), []))
    if (localStorage.getItem(userPostsKey)) setUserPosts(safeJsonParse<UserPost[]>(localStorage.getItem(userPostsKey), []))

    // Liked Posts with migration
    const savedUserPosts = safeJsonParse<UserPost[]>(localStorage.getItem(userPostsKey), [])
    const rawLikedPosts = safeJsonParse<unknown>(localStorage.getItem(likedPostsKey), [])
    const nowIso = new Date().toISOString()
    let normalizedLikedPosts: LikedPost[] = []

    if (Array.isArray(rawLikedPosts)) {
      if (rawLikedPosts.length > 0) {
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
    }
    setLikedPosts(normalizedLikedPosts)
  }, [user?.id])

  // --- Auth Actions ---

  const login = async (email: string, password: string) => {
    const res = await loginAPI({ email, password });
    setGlobalAccessToken(res.accessToken);
    const me = await getMe();
    updateUserStruct(me);
    connectWebSocket(res.accessToken);
  }

  const signup = async (data: { name: string; nickname: string; email: string; password: string }) => {
    await signupAPI(data)
    await login(data.email, data.password)
  }

  const logout = async () => {
    try { await logoutAPI() } catch { }
    disconnectWebSocket();
    setUser(null); setGlobalAccessToken(null); sessionStorage.removeItem("cooksync_user");
    // Clear Local State
    setLikedRecipes([])
    setUserRecipes([])
    setUserPosts([])
    setLikedPosts([])
    setCompletedRecipes(new Set())
    setReviewedRecipes(new Set())
    setConversations([])
    setCurrentMessages([])
  }

  const updateProfile = async (data: UpdateProfileRequest) => {
    if (user) {
      try {
        const payload: UpdateProfileRequest = {}
        if (data.nickname && data.nickname !== user.nickname) payload.nickname = data.nickname
        if (data.profileImageUrl && data.profileImageUrl !== user.profileImageUrl) payload.profileImageUrl = data.profileImageUrl
        if (data.categories) {
          const currentCats = new Set(user.categories || [])
          const newCats = new Set(data.categories)
          if (!(currentCats.size === newCats.size && [...currentCats].every(c => newCats.has(c)))) {
            payload.categories = data.categories
          }
        }
        if (data.newPassword) {
          payload.currentPassword = data.currentPassword
          payload.newPassword = data.newPassword
          payload.newPasswordConfirm = data.newPasswordConfirm
        }

        if (Object.keys(payload).length > 0) {
          await updateProfileAPI(payload)
          const me = await getMe()
          updateUserStruct(me)
        }
      } catch (error) {
        console.error("Failed to update profile", error)
        throw error
      }
    }
  }

  const updateLocation = async (latitude: number, longitude: number): Promise<string> => {
    // 1. 강제 고정 좌표로 호출 (유저 요구사항: 학하동 고정)
    const res = await verifyLocation({ latitude: FIXED_LATITUDE, longitude: FIXED_LONGITUDE });

    let address = "";
    let locationCode = "";

    if (typeof res === "string") {
      address = res;
    } else if (res && typeof res === "object") {
      address = res.locationAddress || "";
      locationCode = res.locationCode || "";
    }

    if (user) {
      const updatedUser = {
        ...user,
        location: address,
        latitude: FIXED_LATITUDE,
        longitude: FIXED_LONGITUDE,
        locationCode
      }
      setUser(updatedUser)
      localStorage.setItem("cooksync_user", JSON.stringify(updatedUser)) // Keep synced
    }

    return address;
  };

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

  // --- Real-time Chat Helpers ---

  const enterChatRoom = async (roomId: string) => {
    if (!roomId || roomId === "undefined") return;

    // 이전 방 구독 해제
    if (currentRoomIdRef.current && currentRoomIdRef.current !== roomId) {
      console.log(`👋 Leaving Room ${currentRoomIdRef.current}`);
      if (subscriptions.current.has(currentRoomIdRef.current)) {
        subscriptions.current.get(currentRoomIdRef.current).unsubscribe();
        subscriptions.current.delete(currentRoomIdRef.current);
      }
    }

    currentRoomIdRef.current = roomId;
    const myId = getCurrentUserId();
    try {
      const msgs = await getChatMessages(Number(roomId));
      if (String(currentRoomIdRef.current) !== String(roomId)) return;

      setCurrentMessages(msgs.map(m => ({
        id: String(m.messageId), roomId: roomId, senderId: String(m.senderId), senderName: m.senderNickname,
        content: m.content, imageUrl: m.imageUrl, timestamp: m.sendTime, isRead: m.read,
        isSentByMe: String(m.senderId) === myId
      })));

      sendReadSignal(roomId);
      setConversations(prev => prev.map(c => c.id === roomId ? { ...c, unreadCount: 0 } : c));

      // Active Room Subscription
      subscribeToRoom(roomId);
    } catch (e) { console.error(e); }
  }

  const exitChatRoom = () => {
    if (currentRoomIdRef.current) {
      console.log(`🚪 Exit Chat Room: ${currentRoomIdRef.current}`);
      if (subscriptions.current.has(currentRoomIdRef.current)) {
        subscriptions.current.get(currentRoomIdRef.current).unsubscribe();
        subscriptions.current.delete(currentRoomIdRef.current);
      }
    }
    currentRoomIdRef.current = null;
  }

  const sendMessage = (roomId: string, content: string) => {
    const token = getGlobalAccessToken();
    const myId = getCurrentUserId();
    if (!stompClient.current?.connected || !token || !myId) return;

    // Optimistic Update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      roomId, senderId: myId,
      senderName: user?.nickname || "나",
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      isSentByMe: true
    };
    setCurrentMessages(prev => [...prev, tempMsg]);

    stompClient.current.publish({
      destination: "/pub/chat/message",
      body: JSON.stringify({ roomId: Number(roomId), content }),
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  const startChatFromPost = async (postId: number): Promise<string> => {
    try {
      const roomId = await createOrEnterChatRoom(postId);
      await fetchConversations(); // ✅ Refresh list to get partner name immediately
      return String(roomId);
    } catch (error) {
      console.error("Failed to start chat from post", error);
      throw error;
    }
  }

  const deleteConversation = async (roomId: string) => {
    try {
      await leaveChatRoom(Number(roomId));
      setConversations(prev => prev.filter(c => c.id !== roomId));
      if (currentRoomIdRef.current === roomId) {
        exitChatRoom();
        setCurrentMessages([]); // ✅ Clear messages from view
      }
    } catch (error) {
      console.error(error);
    }
  }

  // --- Local Data Helpers (Keeping for compatibility) ---

  const toggleLikeRecipe = (recipe: LikedRecipe) => {
    setLikedRecipes((prev) => {
      const isAlreadyLiked = prev.some((r) => r.id === recipe.id)
      const updated = isAlreadyLiked
        ? prev.filter((r) => r.id !== recipe.id)
        : [...prev, { ...recipe, savedAt: new Date().toISOString().split("T")[0].replace(/-/g, ".") }]
      if (user?.id) localStorage.setItem(storageKey("cooksync_liked_recipes", user.id), JSON.stringify(updated))
      return updated
    })
  }

  const isRecipeLiked = (recipeId: string) => likedRecipes.some((r) => r.id === recipeId)

  // Legacy local getMessages support (filtering from local conversations if needed, but we use WS mostly)
  // For 'Messages' page compatibility if it assumes local message struct
  const getMessages = (recipientId: string) => messages.filter((m) => m.recipientId === recipientId)

  const addUserRecipe = (recipe: Omit<UserRecipe, "id" | "createdAt">) => {
    const newId = `user-recipe-${Date.now()}`
    const newRecipe = { ...recipe, id: newId, createdAt: new Date().toISOString() }
    setUserRecipes(prev => {
      const updated = [newRecipe, ...prev]
      if (user?.id) localStorage.setItem(storageKey("cooksync_user_recipes", user.id), JSON.stringify(updated))
      return updated
    })
    earnStars(1, "recipe")
    return newId
  }

  const updateUserRecipe = (id: string, recipe: Partial<Omit<UserRecipe, "id" | "createdAt">>) => {
    setUserRecipes(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...recipe } : r)
      if (user?.id) localStorage.setItem(storageKey("cooksync_user_recipes", user.id), JSON.stringify(updated))
      return updated
    })
  }

  const deleteUserRecipe = (id: string) => {
    setUserRecipes(prev => {
      const updated = prev.filter(r => r.id !== id)
      if (user?.id) localStorage.setItem(storageKey("cooksync_user_recipes", user.id), JSON.stringify(updated))
      return updated
    })
  }

  const addUserPost = (post: Omit<UserPost, "id" | "createdAt" | "status" | "likes">) => {
    const newPost: UserPost = { ...post, id: `user-post-${Date.now()}`, createdAt: new Date().toISOString(), status: "available", likes: 0 }
    setUserPosts(prev => {
      const updated = [newPost, ...prev]
      if (user?.id) localStorage.setItem(storageKey("cooksync_user_posts", user.id), JSON.stringify(updated))
      return updated
    })
  }

  const updateUserPost = (id: string, post: Partial<Omit<UserPost, "id" | "createdAt">>) => {
    setUserPosts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...post } : p)
      if (user?.id) localStorage.setItem(storageKey("cooksync_user_posts", user.id), JSON.stringify(updated))
      return updated
    })
  }

  const deleteUserPost = (id: string) => {
    setUserPosts(prev => {
      const updated = prev.filter(p => p.id !== id)
      if (user?.id) localStorage.setItem(storageKey("cooksync_user_posts", user.id), JSON.stringify(updated))
      return updated
    })
  }

  const toggleLikePost = (postOrEvent: React.MouseEvent | UserPost, maybePost?: UserPost) => {
    if ((postOrEvent as any).stopPropagation) (postOrEvent as React.MouseEvent).stopPropagation()
    const post = (maybePost ?? postOrEvent) as UserPost
    setLikedPosts(prev => {
      const isLiked = prev.some(p => p.id === post.id)
      const updated = isLiked ? prev.filter(p => p.id !== post.id) : [...prev, { ...post, savedAt: new Date().toISOString() }]
      if (user?.id) localStorage.setItem(storageKey("cooksync_liked_posts", user.id), JSON.stringify(updated))
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
        isLoading,
        user, isLoggedIn: !!user, login, signup, logout, updateProfile, updateLocation, withdraw,
        // Chat
        conversations, currentMessages, enterChatRoom, exitChatRoom, startChatFromPost, sendMessage, deleteConversation, getMessages,
        // Local Data
        likedRecipes, toggleLikeRecipe, isRecipeLiked,
        userRecipes, addUserRecipe, updateUserRecipe, deleteUserRecipe,
        userPosts, addUserPost, updateUserPost, deleteUserPost,
        likedPosts, toggleLikePost, isPostLiked,
        earnStars, getStarLevel,
        completedRecipes, markRecipeAsCompleted,
        reviewedRecipes, markRecipeAsReviewed, hasUserReviewedRecipe,
      }}
    >
      {isLoading ? null : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}