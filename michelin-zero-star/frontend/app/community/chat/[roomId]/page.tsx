// michelin-zero-star\frontend\app\community\chat\[roomId]\page.tsx
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, Send, Users, Settings, ImagePlus, Smile, MoreVertical, Pin, LogOut } from "lucide-react"

// ... existing room data ...
const roomData: Record<string, { name: string; icon: string; members: number; color: string }> = {
  "1": { name: "비건 요리 연구소", icon: "🥬", members: 1234, color: "bg-green-100 text-green-700" },
  "2": { name: "다이어터 모임", icon: "💪", members: 2341, color: "bg-blue-100 text-blue-700" },
  "3": { name: "오이 헤이터즈", icon: "🥒", members: 567, color: "bg-red-100 text-red-700" },
  "4": { name: "마라탕 러버", icon: "🌶️", members: 3456, color: "bg-orange-100 text-orange-700" },
  "5": { name: "베이킹 클럽", icon: "🧁", members: 1890, color: "bg-pink-100 text-pink-700" },
  "6": { name: "자취생 요리단", icon: "🍳", members: 4521, color: "bg-yellow-100 text-yellow-700" },
}

const initialMessages = [
  {
    id: 1,
    user: { name: "김비건", avatar: "/korean-woman-avatar.jpg" },
    content: "안녕하세요! 오늘 두부 스테이크 만들어봤는데 대성공이에요 🎉",
    timestamp: "오후 2:30",
    isMe: false,
  },
  {
    id: 2,
    user: { name: "박요리", avatar: "/korean-man-avatar.jpg" },
    content: "오 레시피 공유해주세요!",
    timestamp: "오후 2:31",
    isMe: false,
  },
  {
    id: 3,
    user: { name: "나", avatar: "/chef-robot-avatar-orange.jpg" },
    content: "저도 궁금해요! 두부 스테이크 소스는 뭘로 하셨어요?",
    timestamp: "오후 2:32",
    isMe: true,
  },
  {
    id: 4,
    user: { name: "김비건", avatar: "/korean-woman-avatar.jpg" },
    content: "간장, 올리고당, 마늘 다진 것, 참기름 섞어서 만들었어요. 두부는 수분 빼고 부치면 훨씬 맛있어요!",
    timestamp: "오후 2:33",
    isMe: false,
  },
  {
    id: 5,
    user: { name: "이맛집", avatar: "/young-korean-woman-avatar.jpg" },
    content: "저는 고추장 소스로 해봤는데 그것도 맛있더라고요 👍",
    timestamp: "오후 2:35",
    isMe: false,
  },
  {
    id: 6,
    user: { name: "최건강", avatar: "/diverse-user-avatars.png" },
    content: "비건 치즈 올려서 구우면 더 맛있어요!",
    timestamp: "오후 2:40",
    isMe: false,
  },
]

const pinnedMessage = {
  user: "관리자",
  content: "채팅방 규칙: 서로 존중하며 요리 관련 이야기를 나눠주세요. 광고/홍보는 금지입니다.",
}

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const room = roomData[roomId]

  const [messages, setMessages] = React.useState(initialMessages)
  const [inputValue, setInputValue] = React.useState("")
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage = {
      id: messages.length + 1,
      user: { name: "나", avatar: "/chef-robot-avatar-orange.jpg" },
      content: inputValue,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true }),
      isMe: true,
    }

    setMessages([...messages, newMessage])
    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLeaveRoom = () => {
    setLeaveDialogOpen(false)
    router.push("/community")
  }

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  if (!room) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">채팅방을 찾을 수 없습니다</h1>
            <Button onClick={() => router.push("/community")}>커뮤니티로 돌아가기</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Chat Header */}
        <div className="sticky top-16 z-40 bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push("/community")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${room.color}`}>
                {room.icon}
              </div>
              <div>
                <h1 className="font-semibold">{room.name}</h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{room.members.toLocaleString()}명 참여중</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLeaveDialogOpen(true)} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    채팅방 나가기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Pinned Message */}
          <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm">
            <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-primary">{pinnedMessage.user}: </span>
              <span className="text-muted-foreground">{pinnedMessage.content}</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.isMe ? "flex-row-reverse" : ""}`}>
                {!message.isMe && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={message.user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{message.user.name[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${message.isMe ? "items-end" : "items-start"}`}>
                  {!message.isMe && (
                    <span className="text-xs font-medium text-muted-foreground mb-1">{message.user.name}</span>
                  )}
                  <div
                    className={`max-w-[280px] sm:max-w-[400px] rounded-2xl px-4 py-2 ${
                      message.isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">{message.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim()} size="icon" className="shrink-0">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>채팅방 나가기</DialogTitle>
            <DialogDescription>
              &apos;{room?.name}&apos; 채팅방에서 나가시겠습니까? 나가기 후에도 다시 참여할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleLeaveRoom}>
              나가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
