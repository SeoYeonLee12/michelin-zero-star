// lib/api/chat.ts
import { apiFetch } from "./client"

// --- Types (Backend DTO와 매핑) ---
export interface ChatRoomDto {
  chatRoomId: number
  otherUserId: number
  otherUserNickname: string
  otherUserProfileImage?: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  postTitle: string
  postThumbnail?: string
}

export interface ChatMessageDto {
  messageId: number
  senderId: number
  senderNickname: string
  content: string
  imageUrl?: string
  sendTime: string
  read: boolean
  roomId?: number
}

// --- API Functions ---

// 1. 내 채팅방 목록 조회
export function getChatRooms() {
  return apiFetch<ChatRoomDto[]>("/api/v1/chat/rooms")
}

// 2. 채팅방 생성 또는 입장 (postId 기반)
export function createOrEnterChatRoom(postId: number) {
  // 백엔드가 ChatRoomCreateRequest { postId } 를 받음
  return apiFetch<number>("/api/v1/chat/rooms", {
    method: "POST",
    body: JSON.stringify({ postId }),
  })
}

// 3. 채팅방 메시지 내역 조회
export function getChatMessages(roomId: number) {
  return apiFetch<ChatMessageDto[]>(`/api/v1/chat/rooms/${roomId}/messages`)
}

// 4. 이미지 전송 (HTTP multipart/form-data)
export function sendChatImage(roomId: number, file: File) {
  const formData = new FormData()
  formData.append("file", file)

  // client.ts의 구현에 따라 다르지만 보통 body가 FormData면 Content-Type 헤더를 자동 설정하도록
  // apiFetch가 구현되어 있어야 합니다. (만약 "application/json"이 강제되어 있다면 수정 필요)
  return apiFetch<string>(`/api/v1/chat/rooms/${roomId}/images`, {
    method: "POST",
    body: formData,
  })
}

// 5. 방 나가기
export function leaveChatRoom(roomId: number) {
  return apiFetch<string>(`/api/v1/chat/rooms/${roomId}`, {
    method: "DELETE",
  })
}