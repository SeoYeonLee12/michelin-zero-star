"use client"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  User,
  Users,
  LogOut,
  Settings,
  Send,
  Trash2,
  BookOpen,
  FlaskConical,
  Heart,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  getNotificationsSnapshot,
  subscribeNotifications,
  notificationsActions,
  type NotificationItem,
} from "@/lib/notifications-store"

interface NavbarProps {
  onLogoClick?: () => void
}

function formatKST(isoString?: string) {
  if (!isoString) return ""
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return ""

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "rating":
    case "comment":
      return <img src="/michelin-star.png" alt="미슐랭" className="h-4 w-4" />
    case "like":
      return <Heart className="h-4 w-4 text-red-500" />
    case "message":
      return <MessageCircle className="h-4 w-4 text-[#800020]" />
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />
  }
}

export function Navbar({ onLogoClick }: NavbarProps) {
  const { user, isLoggedIn, logout, conversations } = useAuth()
  const router = useRouter()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [dmOpen, setDmOpen] = useState(false)

  // ✅ Store 기반 알림 상태 (B)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotificationsSnapshot())
  useEffect(() => {
    return subscribeNotifications(() => {
      setNotifications(getNotificationsSnapshot())
    })
  }, [])

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const type = searchParams.get("type")

  const isLibraryActive = pathname === "/recipes" && type === "cook"
  const isLabActive = pathname === "/recipes" && type === "user"
  const isCommunityActive = pathname.startsWith("/community")

  const userLocation = user?.location ? user.location.split(" ").slice(-1)[0] : "우리 동네"

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onLogoClick) {
      e.preventDefault()
      onLogoClick()
      router.push("/")
    }
  }

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])
  const unreadDmCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0)

  const handleNotificationClick = (notif: NotificationItem) => {
    notificationsActions.markRead(notif.id)
    setNotificationOpen(false)
    router.push(notif.link)
  }

  const handleDeleteAllNotifications = () => {
    notificationsActions.clearAll()
  }

  // ✅ 로고 애니메이션 토글 (텍스트 ↔ 별) — 흔들림 해결한 버전 유지
  const [logoMode, setLogoMode] = useState<"text" | "stars">("text")
  const [logoTick, setLogoTick] = useState(0)

  useEffect(() => {
    const INTERVAL_MS = 4500
    const id = window.setInterval(() => {
      setLogoMode((m) => (m === "text" ? "stars" : "text"))
      setLogoTick((t) => t + 1)
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  const logoTextChars = ["미", "슐", "랭", " ", "0", "스", "타"]
  const starStates = [true, true, true, false, false]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
        <Link
          href="/"
          className="flex items-center gap-2 leading-5 tracking-normal w-56 shrink-0"
          onClick={handleLogoClick}
        >
          <div key={`${logoMode}-${logoTick}`} className="flex gap-0.5 items-baseline" aria-label="미슐랭0스타 로고">
            {logoMode === "text" ? (
              logoTextChars.map((char, index) => (
                <span
                  key={index}
                  className="text-xl font-bold tracking-tight text-foreground inline-block"
                  style={{ animation: `slideUpLetters 0.6s ease-out ${index * 0.08}s both` }}
                >
                  {char}
                </span>
              ))
            ) : (
              <div className="flex items-baseline gap-0.5">
                {starStates.map((isFull, index) => (
                  <img
                    key={index}
                    src={isFull ? "/michelin-full-star.png" : "/michelin-star.png"}
                    alt={isFull ? "채워진 미슐랭 마크" : "비어있는 미슐랭 마크"}
                    className="inline-block h-5 w-5"
                    style={{ animation: `slideUpLetters 0.6s ease-out ${index * 0.08}s both` }}
                    draggable={false}
                  />
                ))}
              </div>
            )}
          </div>
        </Link>

        <nav className="hidden lg:flex flex-1 justify-center" aria-label="Primary">
          <div className="flex items-center gap-1">
            <Link
              href="/recipes?type=cook"
              className={cn(
                "group inline-flex flex-row items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 gap-2",
                isLibraryActive
                  ? "bg-[#800020]/10 text-[#800020] ring-1 ring-[#800020]/30"
                  : "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <BookOpen className={cn("h-4 w-4", isLibraryActive && "text-[#800020]")} />
              <span>레시피 도서관</span>
            </Link>

            <Link
              href="/recipes?type=user"
              className={cn(
                "group inline-flex flex-row items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 gap-2",
                isLabActive
                  ? "bg-[#800020]/10 text-[#800020] ring-1 ring-[#800020]/30"
                  : "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <FlaskConical className={cn("h-4 w-4", isLabActive && "text-[#800020]")} />
              <span>레시피 연구소</span>
            </Link>

            <Link
              href="/community"
              className={cn(
                "group inline-flex flex-row items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 gap-2",
                isCommunityActive
                  ? "bg-[#800020]/10 text-[#800020] ring-1 ring-[#800020]/30"
                  : "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Users className={cn("h-4 w-4 shrink-0", isCommunityActive && "text-[#800020]")} />
              <span>{userLocation} 나눔</span>
            </Link>
          </div>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          {isLoggedIn && (
            <>
              <Popover open={dmOpen} onOpenChange={setDmOpen}>
                <PopoverTrigger asChild>
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-accent relative h-9 w-9"
                  >
                    <Send className="h-5 w-5" />
                    {unreadDmCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-medium">
                        {unreadDmCount}
                      </span>
                    )}
                  </Button> */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-transparent relative h-9 w-9"
                  >
                    <Send className="h-5 w-5" />
                    {unreadDmCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-medium">
                        {unreadDmCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-3 border-b flex items-center justify-between">
                    <h4 className="font-semibold">채팅</h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>아직 쪽지가 없습니다</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <Link
                          key={conv.id}
                          href={`/messages/${conv.recipientId}`}
                          className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => setDmOpen(false)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.recipientAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{conv.recipientName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{conv.recipientName}</span>
                              <span className="text-xs text-muted-foreground">{formatKST(conv.lastMessageTime)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="h-5 w-5 rounded-full bg-[#800020] text-[10px] text-white flex items-center justify-center font-medium">
                              {conv.unreadCount}
                            </span>
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                  {/* <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-[#800020]" asChild>
                      <Link href="/messages">모든 채팅 보기</Link>
                    </Button>
                  </div> */}
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-[#800020] hover:bg-transparent hover:text-[#800020]
                        focus-visible:ring-0 focus-visible:ring-offset-0" asChild>
                      <Link href="/messages">모든 채팅 보기</Link>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-accent relative h-9 w-9"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-3 border-b flex items-center justify-between">
                    <h4 className="font-semibold">알림</h4>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleDeleteAllNotifications}
                        className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        모두 삭제
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">알림이 없습니다</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn(
                            "p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors",
                            !notif.read && "bg-[#800020]/5",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-[#800020] mb-0.5">{notif.title}</p>
                              <p className="text-sm">{notif.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-[#800020]" asChild>
                      <Link href="/notifications">모든 알림 보기</Link>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover> */}
            </>
          )}

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                    <AvatarFallback>{user?.name?.charAt(0) || <User className="h-4 w-4" />}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/mypage" className="flex w-full items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    마이페이지
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex w-full items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    프로필 설정
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              {/* <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">로그인</Link>
              </Button> */}
              <Button
                variant="ghost"
                asChild
                className="hidden sm:inline-flex hover:bg-transparent focus:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild className="bg-[#800020] hover:bg-[#800020]/90">
                <Link href="/signup">시작하기</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}