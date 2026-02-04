// michelin-zero-star\frontend\app\community\[id]\page.tsx
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
import { getPostDetail, deletePost } from "@/lib/api/market"
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Pencil,
  Loader2, // 로딩 아이콘 추가
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  // ✅ startChatFromPost 추가
  const { isLoggedIn, user, likedPosts, toggleLikePost, startChatFromPost } = useAuth()

  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)

  // ✅ 채팅방 생성 로딩 상태 추가
  const [isCreatingChat, setIsCreatingChat] = useState(false)

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

  // 좋아요 상태 확인
  const isLiked = likedPosts.some((p) => p.id === postId)
  const isMyPost = post?.owner || false

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

  const handleLike = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    const postForContext = {
      id: String(post.id),
      title: post.title,
      description: post.content,
      price: post.price.toLocaleString(),
      image: post.imageUrls?.[0] || "",
      place: post.meetingPlace,
      likes: 0,
      createdAt: post.createdAt,
      status: post.status as "available" | "completed",
    }
    toggleLikePost(e, postForContext as any)
  }

  // ✅ [핵심 수정] 채팅하기 버튼 핸들러
  const handleChat = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.")
      router.push("/login")
      return
    }

    if (isCreatingChat) return; // 중복 클릭 방지
    setIsCreatingChat(true);

    try {
      // 1. postId를 숫자로 변환
      const numericPostId = Number(post.id);

      // 2. AuthContext의 함수를 통해 백엔드에서 방 생성/조회 후 roomId 획득
      const roomId = await startChatFromPost(numericPostId);

      if (!roomId || roomId === "undefined") {
        throw new Error("Invalid Room ID");
      }

      // 3. 획득한 roomId를 쿼리 파라미터로 넘기며 이동
      router.push(`/messages?roomId=${roomId}`);

    } catch (error) {
      console.error("채팅방 입장 실패:", error);
      alert("채팅방을 생성하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setIsCreatingChat(false);
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % post.imageUrls.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + post.imageUrls.length) % post.imageUrls.length)
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

  const likeCount = (post.likes || 0) + (isLiked ? 1 : 0)

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
              {post.status === "completed" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge className="bg-gray-600 text-white text-lg px-4 py-2">거래 완료</Badge>
                </div>
              )}
              {post.imageUrls?.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
              <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-black/50 rounded-full px-3 py-1.5">
                <button
                  className={cn("flex items-center gap-1 text-white transition-colors", isLiked && "text-red-400")}
                  onClick={handleLike}
                >
                  <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                  <span className="text-sm font-medium">{likeCount}</span>
                </button>
                <div className="flex items-center gap-1 text-white">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{post.chatCount || 0}</span>
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
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
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

            {isMyPost && (
              <div className="p-4 bg-[#800020]/5 rounded-xl border border-[#800020]/20 space-y-3">
                <p className="text-sm font-medium text-[#800020]">내 게시글 관리</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/community/edit/${postId}`)}
                    className="flex-1 gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    수정
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="flex-1 gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    삭제
                  </Button>
                </div>
              </div>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Avatar className="h-12 w-12">
                <AvatarImage src={"/placeholder.svg"} />
                <AvatarFallback>{post.writerNickname?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{post.writerNickname}</p>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {post.location}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
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

              {/* ✅ 수정된 채팅 버튼 */}
              <Button
                size="lg"
                className="flex-1 gap-2 bg-[#800020] hover:bg-[#800020]/90"
                onClick={handleChat}
                disabled={post.status === "completed" || isMyPost || isCreatingChat}
              >
                {isCreatingChat ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
                {isMyPost ? "내 게시글" : isCreatingChat ? "연결 중..." : "채팅하기"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}