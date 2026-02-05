// michelin-zero-star\frontend\app\messages\[userId]\page.tsx
"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Send, MessageCircle, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
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
    exitChatRoom,
    sendMessage,
    deleteConversation
  } = useAuth()

  const router = useRouter()
  const searchParams = useSearchParams()

  // 현재 선택된 방 ID
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  // State for message input
  const [messageText, setMessageText] = useState("")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isValidId = (id: string | null | undefined): boolean => {
    return !!id && id !== "undefined" && id !== "null" && !isNaN(Number(id));
  }

  // 1. 로그인 체크
  useEffect(() => {
    if (!isLoggedIn) router.push("/login")
  }, [isLoggedIn, router])

  // 2. URL 변경 감지하여 방 입장 (★ 핵심: URL이 바뀌면 자동으로 방 입장, 없으면 퇴장)
  useEffect(() => {
    const paramRoomId = searchParams.get("roomId")

    // URL에 roomId가 있고, 현재 선택된 방과 다르면 입장 시도
    if (isValidId(paramRoomId)) {
      if (paramRoomId !== selectedRoomId) {
        console.log(`🔄 URL 변경 감지: 방 ${paramRoomId} 입장`);
        setSelectedRoomId(paramRoomId!)
        enterChatRoom(paramRoomId!)
      }
    } else {
      // URL에 roomId가 없으면 선택 해제 (나가기 처리 후)
      if (selectedRoomId) {
        console.log("🔄 URL 변경 감지: 방 선택 해제");
        setSelectedRoomId(null)
        exitChatRoom()
      }
    }
  }, [searchParams, selectedRoomId])

  // 페이지 언마운트 감지하여 채팅방 나가기 (Cleanup)
  useEffect(() => {
    return () => {
      console.log("👋 MessagesPage Unmount -> Calling exitChatRoom");
      exitChatRoom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages])

  // 방 선택 핸들러
  const handleSelectConversation = (roomId: string) => {
    if (!isValidId(roomId)) return;
    if (roomId === selectedRoomId) return;

    // URL만 변경하면 useEffect가 감지하여 처리함
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("roomId", roomId);
    router.replace(newUrl.pathname + newUrl.search)
  }

  const handleSend = () => {
    if (!isValidId(selectedRoomId) || !messageText.trim()) return

    const content = messageText
    sendMessage(selectedRoomId!, content)
    setMessageText("")
  }

  const handleDeleteConversation = async () => {
    if (selectedRoomId) {
      const roomIdToDelete = selectedRoomId;
      setDeleteDialogOpen(false)
      // setSelectedRoomId(null) -> Race Condition 방지를 위해 제거 (URL 변경 시 useEffect가 처리)

      await deleteConversation(roomIdToDelete)

      // Use router to update URL so searchParams hook updates correctly
      router.replace("/messages")
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
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-0 py-0 flex overflow-hidden min-h-0">
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
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="h-16 flex items-center justify-between px-6 border-b bg-white shadow-sm z-10 shrink-0">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f9fafb] min-h-0">
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
                          {(() => {
                            const timeStr = msg.timestamp;
                            // If timestamp is ISO string without Z (e.g. from Java LocalDateTime), treat as UTC
                            const date = new Date(timeStr.endsWith("Z") ? timeStr : timeStr + "Z");
                            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          })()}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSend()}
                    placeholder="메시지 입력..."
                    className={cn(
                      "rounded-full bg-gray-100 border-none focus-visible:ring-1",
                      messageText.length > 1000 ? "focus-visible:ring-red-500 ring-1 ring-red-500" : "focus-visible:ring-[#800020]"
                    )}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!messageText.trim() || messageText.length > 1000}
                    className={cn(
                      "rounded-full w-10 h-10 p-0 shrink-0",
                      messageText.length > 1000 ? "bg-gray-400 hover:bg-gray-400" : "bg-[#800020] hover:bg-[#800020]/90"
                    )}
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
                <div className={cn("text-xs text-right px-2", messageText.length > 1000 ? "text-red-500 font-medium" : "text-gray-400")}>
                  {messageText.length} / 1000
                </div>
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