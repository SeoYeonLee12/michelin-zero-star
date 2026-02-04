// michelin-zero-star\frontend\app\messages\[userId]\page.tsx
"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Send, MessageCircle, ChevronLeft, ChevronRight, LogOut, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/cook-sync/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"

const ITEMS_PER_PAGE = 5

export default function MessagesPage() {
  const {
    isLoggedIn,
    conversations,
    currentMessages,
    enterChatRoom,
    exitChatRoom, // Destructure this to separate scope!
    sendMessage,
    deleteConversation
  } = useAuth()

  const router = useRouter()
  const searchParams = useSearchParams()

  // 현재 선택된 방 ID
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const [messageText, setMessageText] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isValidId = (id: string | null | undefined): boolean => {
    return !!id && id !== "undefined" && id !== "null" && !isNaN(Number(id));
  }

  // 1. 로그인 체크
  useEffect(() => {
    if (!isLoggedIn) router.push("/login")
  }, [isLoggedIn, router])

  // 2. URL 변경 감지하여 방 입장 (★ 핵심: URL이 바뀌면 자동으로 방 입장)
  useEffect(() => {
    const paramRoomId = searchParams.get("roomId")

    // URL에 roomId가 있고, 현재 선택된 방과 다르면 입장 시도
    if (isValidId(paramRoomId) && paramRoomId !== selectedRoomId) {
      console.log(`🔄 URL 변경 감지: 방 ${paramRoomId} 입장`);
      setSelectedRoomId(paramRoomId!)
      enterChatRoom(paramRoomId!)
    }
  }, [searchParams, selectedRoomId])

  // ★ 페이지 언마운트 감지하여 채팅방 나가기 (Cleanup)
  useEffect(() => {
    // 컴포넌트 마운트 시에는 아무것도 안함

    // 언마운트 시 cleanup 실행
    return () => {
      console.log("👋 MessagesPage Unmount -> Calling exitChatRoom");
      exitChatRoom(); // 이제 정의되어 있으므로 호출 가능
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 배열: 마운트/언마운트 시에만 실행

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages])

  // ★ 방 선택 핸들러 (클릭 시 실행)
  // ★ 방 선택 핸들러 (클릭 시 실행)
  const handleSelectConversation = (roomId: string) => {
    if (!isValidId(roomId)) return;

    // 이미 같은 방이면 무시
    if (roomId === selectedRoomId) return;

    setSelectedRoomId(roomId)
    enterChatRoom(roomId) // 즉시 입장

    // URL 업데이트 (페이지 이동 느낌을 주면서 리로드 없이 상태 변경)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("roomId", roomId);
    window.history.pushState({}, "", newUrl);
  }

  const handleSend = () => {
    if (!isValidId(selectedRoomId) || (!messageText.trim() && !imagePreview)) return

    const content = imagePreview ? `[이미지:${imagePreview}]${messageText}` : messageText
    sendMessage(selectedRoomId!, content)

    setMessageText("")
    setImagePreview(null)
  }

  const handleDeleteConversation = async () => {
    if (selectedRoomId) {
      await deleteConversation(selectedRoomId)
      setDeleteDialogOpen(false)
      setSelectedRoomId(null)
      // URL에서도 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("roomId");
      window.history.pushState({}, "", newUrl);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // 선택된 대화방 정보 찾기
  const selectedConversation = conversations.find((c) => c.id === selectedRoomId) || {
    id: selectedRoomId || "",
    recipientName: "채팅상대",
    recipientAvatar: undefined,
    unreadCount: 0,
    lastMessage: "",
    recipientId: "",
    lastMessageTime: "",
    postTitle: ""
  }

  const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE) || 1
  const paginatedConversations = conversations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  if (!isLoggedIn) return null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-0 py-0 flex overflow-hidden h-[calc(100vh-64px)]">
        {/* 좌측 패널 (목록) */}
        <div className="w-80 border-r bg-white flex flex-col">
          <div className="h-16 px-6 flex items-center border-b">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Send className="h-5 w-5 text-[#800020]" />
              채팅함
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
                <p>대화 목록이 없습니다</p>
              </div>
            ) : (
              paginatedConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full px-4 py-3 border-b flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer",
                    selectedRoomId === conv.id && "bg-[#800020]/5 border-l-4 border-l-[#800020]"
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={conv.recipientAvatar || "/placeholder.svg"} />
                    <AvatarFallback>{conv.recipientName.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-sm truncate">{conv.recipientName}</p>
                      {/* 현재 선택된 방은 뱃지 숨김 (이미 읽었으므로) */}
                      {conv.unreadCount > 0 && selectedRoomId !== conv.id && (
                        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#800020] text-xs text-white flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t bg-gray-50">
              <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs">{currentPage} / {totalPages}</span>
              <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 우측 패널 (대화창) */}
        {selectedRoomId ? (
          <div className="flex-1 flex flex-col bg-white">
            <div className="h-16 flex items-center justify-between px-6 border-b bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={selectedConversation.recipientAvatar || "/placeholder.svg"} />
                  <AvatarFallback>{selectedConversation.recipientName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-bold text-base">{selectedConversation.recipientName}</h2>
                  {selectedConversation.postTitle && (
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {selectedConversation.postTitle} 관련 대화
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)}>
                <LogOut className="h-5 w-5 text-gray-400 hover:text-destructive" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f9fafb]">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                  <p>대화를 시작해보세요!</p>
                </div>
              ) : (
                currentMessages.map((msg, idx) => {
                  let content = msg.content;
                  let imgSrc = msg.imageUrl;
                  if (content && content.startsWith("[이미지:")) {
                    const match = content.match(/\[이미지:(data:image[^\]]+)\](.*)/)
                    if (match) {
                      imgSrc = match[1];
                      content = match[2].trim();
                    }
                  }

                  return (
                    <div key={`${msg.id}-${idx}`} className={cn("flex w-full", msg.isSentByMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex max-w-[70%] items-end gap-2", msg.isSentByMe ? "flex-row-reverse" : "flex-row")}>
                        {!msg.isSentByMe && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={selectedConversation.recipientAvatar} />
                            <AvatarFallback>{selectedConversation.recipientName.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          "px-4 py-2 rounded-2xl text-sm shadow-sm whitespace-pre-wrap break-words",
                          msg.isSentByMe ? "bg-[#800020] text-white rounded-br-none" : "bg-white text-gray-800 border rounded-bl-none"
                        )}>
                          {imgSrc && (
                            <Image src={imgSrc} alt="첨부 이미지" width={200} height={200} className="rounded-lg mb-2 object-cover" />
                          )}
                          {content}
                        </div>
                        <span className="text-[10px] text-gray-400 mb-1 shrink-0">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <Image src={imagePreview} alt="Preview" width={80} height={80} className="rounded-lg border" />
                  <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0">
                  <Plus className="h-5 w-5 text-gray-500" />
                </Button>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />

                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSend()}
                  placeholder="메시지 입력..."
                  className="rounded-full bg-gray-100 border-none focus-visible:ring-1 focus-visible:ring-[#800020]"
                />
                <Button onClick={handleSend} disabled={!messageText.trim() && !imagePreview} className="rounded-full bg-[#800020] hover:bg-[#800020]/90 w-10 h-10 p-0 shrink-0">
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-muted-foreground">
            <MessageCircle className="h-16 w-16 mb-4 opacity-10" />
            <p>채팅방을 선택해주세요</p>
          </div>
        )}
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>채팅방 나가기</DialogTitle>
            <DialogDescription>대화방을 나가시겠습니까? 대화 내역이 삭제됩니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDeleteConversation}>나가기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}