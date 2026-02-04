"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { ScrollToTop } from "@/components/cook-sync/scroll-to-top"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getPostDetail, deletePost, toggleLike, updatePostStatus } from "@/lib/api/market"
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  Pencil,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import { cn } from "@/lib/utils"

const mockPosts: Record<
  string,
  {
    id: string
    user: { id: string; name: string; avatar: string; location: string; starLevel: number }
    title: string
    description: string
    price: string
    images: string[]
    place: string
    timeAgo: string
    likes: number
    chatCount: number
    status: "available" | "completed"
  }
> = {
  "1": {
    id: "1",
    user: {
      id: "user1",
      name: "김대전",
      avatar: "/korean-woman-avatar.jpg",
      location: "대전 서구 둔산동",
      starLevel: 3,
    },
    title: "양배추 반 통 나눠요",
    description:
      "대형마트에서 양배추 샀는데 혼자 다 못 먹을 것 같아요.\n반 통 1000원에 나눕니다!\n\n상태 좋고 신선해요. 둔산동 근처에서 직거래 가능합니다.",
    price: "1,000원",
    images: ["/half-cabbage.jpg"],
    place: "둔산동 이마트 앞",
    timeAgo: "10분 전",
    likes: 5,
    chatCount: 3,
    status: "available",
  },
  "2": {
    id: "2",
    user: {
      id: "user2",
      name: "박요리",
      avatar: "/korean-man-avatar.jpg",
      location: "대전 유성구 봉명동",
      starLevel: 5,
    },
    title: "계란 한 판 나눔 하실 분",
    description: "계란 30개 한 판 사서 10개씩 나눠요.\n신선한 당일 구매 제품입니다.\n\n봉명동 근처에서 직거래 원해요!",
    price: "2,500원/10개",
    images: ["/eggs-carton.png"],
    place: "봉명동 롯데마트 정문",
    timeAgo: "25분 전",
    likes: 12,
    chatCount: 5,
    status: "available",
  },
  "3": {
    id: "3",
    user: {
      id: "user3",
      name: "이맛집",
      avatar: "/young-korean-woman-avatar.jpg",
      location: "대전 중구 대흥동",
      starLevel: 2,
    },
    title: "고구마 3kg 같이 사요",
    description:
      "꿀고구마 박스로 사면 싼데 혼자 다 못 먹어서...\n같이 나와서 사실 분 구해요!\n\n대흥동 마트 앞에서 만나요.",
    price: "5,000원/1kg",
    images: ["/roasted-sweet-potatoes.png"],
    place: "대흥동 하나로마트",
    timeAgo: "1시간 전",
    likes: 8,
    chatCount: 2,
    status: "completed",
  },
}

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { isLoggedIn, user, toggleLikePost } = useAuth()
  // const { isLoggedIn, userPosts, user, likedPosts, toggleLikePost, updateUserPost } = useAuth() // AuthContext의 userPosts 사용 중단
  // likedPosts는 AuthContext에서 가져오되, 상세 조회 시 API에서 like 여부를 알 수 있다면 좋음.
  // 현재 API에는 'owner' 필드가 있고, 'isLiked'는 없음. likedPosts를 통해 확인.

  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<"SELLING" | "SOLD">("SELLING")

  useEffect(() => {
    async function fetchPost() {
      try {
        const data = await getPostDetail(postId)
        setPost(data)
      } catch (error) {
        console.error("Failed to fetch post:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [postId])

  const { likedPosts } = useAuth()
  const isLiked = likedPosts.some((p) => p.id === postId)

  const isMyPost = post?.owner || post?.isOwner || false

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-4xl px-4 py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-3xl px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">게시글을 찾을 수 없습니다.</p>
            <Button variant="link" className="text-[#800020] mt-2" onClick={() => router.push("/community")}>
              목록으로 돌아가기
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    try {
      await toggleLike(String(post.id))

      toggleLikePost(e, {
        id: String(post.id),
        title: post.title,
        description: post.content,
        price: post.price.toLocaleString(),
        image: post.imageUrls[0],
        place: post.meetingPlace,
        likes: post.likeCount || 0,
        createdAt: post.createdAt,
        status: post.status as "available" | "completed",
      } as any)

      setPost((prev: any) => ({
        ...prev,
        likeCount: (prev.likeCount ?? prev.like_count ?? 0) + (isLiked ? -1 : 1),
        like_count: (prev.likeCount ?? prev.like_count ?? 0) + (isLiked ? -1 : 1),
      }))

    } catch (error) {
      console.error("좋아요 처리 실패:", error)
      alert("좋아요 처리에 실패했습니다.")
    }
  }

  const handleChat = () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    router.push(`/messages/${post.writerId}?name=${encodeURIComponent(post.nickname || "이웃")}`)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % post.imageUrls.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + post.imageUrls.length) % post.imageUrls.length)
  }

  const handleStatusChange = async (newStatus: "SELLING" | "SOLD") => {
    setPendingStatus(newStatus)
    setStatusDialogOpen(true)
  }

  const confirmStatusChange = async () => {
    try {
      if (pendingStatus === "SOLD") {
        await updatePostStatus(String(post.id), "SOLD")
      } else {
        await updatePostStatus(String(post.id), "SELLING")
      }
      // 상태 변경 후 페이지 새로고침 (또는 로컬 상태 업데이트)
      window.location.reload()
    } catch (error) {
      console.error("상태 변경 실패:", error)
      alert("상태 변경에 실패했습니다.")
    } finally {
      setStatusDialogOpen(false)
    }
  }


  const handleDelete = async () => {
    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      try {
        await deletePost(post.id)
        alert("게시글이 삭제되었습니다.")
        router.push("/community")
      } catch (e) {
        console.error("Delete failed", e)
        alert("삭제 실패")
      }
    }
  }

  const likeCount = post.likeCount ?? post.like_count ?? 0 // API에서 likeCount 가져오기 (snake_case 대응)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <ScrollToTop />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/community")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Image */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
              <Image
                src={post.imageUrls?.[currentImageIndex] || "/placeholder.svg"}
                alt={post.title}
                fill
                className="object-cover"
              />
              {post.status === "SOLD" && (
                <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-white">
                  <CheckCircle className="w-16 h-16 mb-3" />
                  <span className="text-2xl font-bold">거래 완료</span>
                </div>
              )}
              {post.imageUrls?.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 z-20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 z-20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {post.imageUrls.map((_: any, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          idx === currentImageIndex ? "bg-white" : "bg-white/50",
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* Heart and comments moved to bottom right of image */}
              <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-black/50 rounded-full px-3 py-1.5 z-20">
                <div
                  className={cn("flex items-center gap-1 text-white")}
                >
                  <Heart className={cn("h-5 w-5", "fill-white")} />
                  <span className="text-sm font-medium">{likeCount}</span>
                </div>
                <div className="flex items-center gap-1 text-white">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{post.chatCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{(() => {
                  const dateStr = post.createdAt.endsWith("Z") ? post.createdAt : post.createdAt + "Z"
                  const date = new Date(dateStr)
                  return `${date.toLocaleDateString("ko-KR", {
                    year: "numeric", month: "numeric", day: "numeric"
                  })} ${date.toLocaleTimeString("ko-KR", {
                    hour: "2-digit", minute: "2-digit", hour12: true
                  })}`
                })()}</span>
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-[#800020]">{post.price.toLocaleString()}원</p>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">거래 장소: {post.meetingPlace || post.location}</span>
            </div>

            <div className="whitespace-pre-line text-muted-foreground">{post.content}</div>



            {/* User Profile */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.profileImageUrl || "/placeholder.svg"} />
                <AvatarFallback>{post.nickname?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{post.nickname}</p>
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#800020] bg-[#800020]/10 px-2 py-0.5 rounded-full border border-[#800020]/20">
                    <Image
                      src="/michelin-star.png"
                      alt="Michelin Star"
                      width={12}
                      height={12}
                      className="object-contain"
                    />
                    미슐랭 {post.totalStar}스타
                  </span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {post.location}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isMyPost ? (
                // Owner Setup - Minimal Design
                <div className="flex flex-1 gap-2">
                  <Button
                    variant={post.status === "SOLD" ? "default" : "default"}
                    className={cn(
                      "flex-[2] font-semibold",
                      post.status === "SOLD"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-[#800020] hover:bg-[#800020]/90",
                    )}
                    onClick={() => handleStatusChange(post.status === "SOLD" ? "SELLING" : "SOLD")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {post.status === "SOLD" ? "거래 완료됨" : "거래 완료로 변경"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                    onClick={() => router.push(`/community/new?edit=${postId}`)}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-300"
                    onClick={handleDelete}
                  >
                    삭제
                  </Button>
                </div>
              ) : (
                // Viewer Setup
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "flex-1 gap-2",
                      isLiked && "border-red-500 text-red-500 hover:text-red-600 hover:border-red-600",
                    )}
                    onClick={handleLike}
                  >
                    <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                    관심 {likeCount}
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 gap-2 bg-[#800020] hover:bg-[#800020]/90"
                    onClick={handleChat}
                    disabled={post.status === "SOLD"}
                  >
                    <MessageCircle className="h-5 w-5" />
                    채팅하기
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>판매 상태 변경</DialogTitle>
            <DialogDescription>
              {pendingStatus === "SOLD"
                ? "이 게시글을 '거래 완료' 상태로 변경하시겠습니까? 거래가 완료되면 더 이상 채팅을 받을 수 없습니다."
                : "이 게시글을 '판매 중' 상태로 변경하시겠습니까?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmStatusChange} className="bg-[#800020] hover:bg-[#800020]/90">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
