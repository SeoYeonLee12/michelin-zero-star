"use client"

import * as React from "react"
import { Client, IMessage } from "@stomp/stompjs"
import { getMe, updateProfile as updateProfileAPI, verifyLocation } from "./api/user"
import { login as loginAPI, logout as logoutAPI, refreshAccessToken } from "./api/auth"
import { setGlobalAccessToken, getGlobalAccessToken } from "./api/client"
import {
  getChatRooms,
  getChatMessages,
  createOrEnterChatRoom,
  leaveChatRoom,
  type ChatRoomDto,
  type ChatMessageDto
} from "./api/chat"
import { toast } from "@/components/ui/use-toast"

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

// --- Interfaces ---
interface User { id: string; name: string; nickname: string; email: string; profileImage?: string; level: string; bio: string; location?: string; latitude?: number; longitude?: number; locationCode?: string; stars: number; todayStars: number; lastStarDate: string; isVerified?: boolean; }
interface Message { id: string; roomId: string; senderId: string; senderName: string; content: string; timestamp: string; isRead: boolean; isSentByMe: boolean; imageUrl?: string; }
interface Conversation { id: string; recipientId: string; recipientName: string; recipientAvatar?: string; lastMessage: string; lastMessageTime: string; unreadCount: number; postTitle?: string; postThumbnail?: string; }

interface AuthContextType {
  isLoading: boolean; user: User | null; isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  conversations: Conversation[];
  currentMessages: Message[];
  enterChatRoom: (roomId: string) => Promise<void>;
  exitChatRoom: () => void;
  startChatFromPost: (postId: number) => Promise<string>;
  sendMessage: (roomId: string, content: string) => void;
  deleteConversation: (roomId: string) => Promise<void>;
  updateLocation: (lat: number, lng: number) => Promise<string>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [user, setUser] = React.useState<User | null>(null)
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [currentMessages, setCurrentMessages] = React.useState<Message[]>([])

  const stompClient = React.useRef<Client | null>(null)
  const subscriptions = React.useRef<Map<string, any>>(new Map())
  const isAuthInitialized = React.useRef(false)
  const currentRoomIdRef = React.useRef<string | null>(null)

  // 🛠️ 1. 내 ID 판별 함수 (String 비교로 엄격하게 관리)
  const getCurrentUserId = (): string | null => {
    const savedUserRaw = sessionStorage.getItem("cooksync_user")
    if (savedUserRaw) {
      try { return String(JSON.parse(savedUserRaw).id); } catch { return null; }
    }
    return user?.id ? String(user.id) : null;
  }

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
      setConversations(mapped);
      // ❌ [CRITICAL FIX] 모든 방을 구독하지 않음!
      // mapped.forEach(room => subscribeToRoom(room.id)); 
    } catch (error) { console.error(error); }
  }

  const connectWebSocket = (token: string) => {
    if (stompClient.current) disconnectWebSocket();
    console.log("🔌 Connecting WebSocket...");
    const client = new Client({
      brokerURL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws-stomp",
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
        setUser(null); setGlobalAccessToken(null); sessionStorage.removeItem("cooksync_user");
      } finally { setIsLoading(false) }
    }
    if (!isAuthInitialized.current) { isAuthInitialized.current = true; initAuth(); }

    // 이벤트 리스너: 토큰 갱신 시 재연결
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

  const disconnectWebSocket = () => {
    if (stompClient.current) { stompClient.current.deactivate(); stompClient.current = null; }
    subscriptions.current.forEach(sub => sub.unsubscribe?.());
    subscriptions.current.clear();
  }

  const enterChatRoom = async (roomId: string) => {
    if (!roomId || roomId === "undefined") return;

    // 이전 방 구독 해제 (중복 방지)
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

      // ✅ [CRITICAL] 여기서만 방 구독 (Single Active Room)
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
    const tempMsg: Message = { id: `temp-${Date.now()}`, roomId, senderId: myId, senderName: user?.nickname || "나", content, timestamp: new Date().toISOString(), isRead: false, isSentByMe: true };
    setCurrentMessages(prev => [...prev, tempMsg]);
    stompClient.current.publish({ destination: "/pub/chat/message", body: JSON.stringify({ roomId: Number(roomId), content }), headers: { Authorization: `Bearer ${token}` } });
  }

  const updateUserStruct = (me: any) => {
    const newUser: User = { id: String(me.id), name: me.name, nickname: me.nickname, email: me.email, profileImage: me.profileImage, level: me.level, bio: me.bio, stars: me.stars, todayStars: me.todayStars, lastStarDate: me.lastStarDate };
    setUser(newUser);
    sessionStorage.setItem("cooksync_user", JSON.stringify(newUser));
    return newUser;
  }

  const login = async (email: string, password: string) => {
    const res = await loginAPI({ email, password });
    setGlobalAccessToken(res.accessToken);
    const me = await getMe();
    updateUserStruct(me);
    connectWebSocket(res.accessToken);
  }

  const logout = async () => {
    try { await logoutAPI() } catch { }
    disconnectWebSocket();
    setUser(null); setGlobalAccessToken(null); sessionStorage.removeItem("cooksync_user");
  }

  const updateLocation = async (lat: number, lng: number) => {
    const res = await verifyLocation({ latitude: lat, longitude: lng });

    let address = "";
    let message = "";

    if (typeof res === "string") {
      address = res;
      message = res;
    } else if (res && typeof res === "object") {
      address = res.locationAddress || "";
      message = res.message || res.locationAddress || "";
    }

    // 유저 상태에는 '주소(동이름)'만 저장
    if (address) {
      const newUser = { ...user, location: address };
      updateUserStruct(newUser);
    }

    // 호출자에게는 구조화된 데이터 리턴
    return { message, address };
  }

  return (
    <AuthContext.Provider value={{ isLoading, user, isLoggedIn: !!user, login, signup: async () => { }, logout, updateProfile: async () => { }, conversations, currentMessages, enterChatRoom, exitChatRoom, startChatFromPost: async () => "", sendMessage, deleteConversation: async () => { }, updateLocation }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}