"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { AccessDenied } from "@/components/cook-sync/access-denied"
import { ScrollToTop } from "@/components/cook-sync/scroll-to-top"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Search, ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import { cn } from "@/lib/utils"

import { useEffect } from "react"
import { getNearbyPosts, getPostList } from "@/lib/api/market"

const initialShares: any[] = [] // 더미 데이터 제거 (타입 유지를 위해 빈 배열)


const ITEMS_PER_PAGE = 10

export default function CommunityPage() {
  const router = useRouter()
  const { isLoggedIn, user, userPosts, likedPosts, toggleLikePost } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [hideCompleted, setHideCompleted] = useState(false)
  // API 연동: 게시글 목록 상태
  const [posts, setPosts] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<"nearby" | "all">("nearby")

  useEffect(() => {
    async function fetchPosts() {
      try {
        let data;
        if (viewMode === "nearby") {
          // 주변 5km 게시글 조회
          data = await getNearbyPosts(5)
        } else {
          // 전체 게시글 조회
          data = await getPostList()
        }
        setPosts(data)
      } catch (error) {
        console.error("Failed to fetch posts:", error)
      }
    }
    if (isLoggedIn && user?.location) {
      fetchPosts()
    }
  }, [isLoggedIn, user?.location, viewMode])

  // 로그인 체크
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <AccessDenied type="login" />
      </div>
    )
  }

  // 동네 인증 체크
  if (!user?.location) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <AccessDenied type="location" />
      </div>
    )
  }



  // userLocation 등 기존 로직 유지
  const userLocation = user?.location ? user.location.split(" ").slice(-1)[0] : "우리 동네"

  // API 데이터를 화면 포맷에 맞게 변환
  const allShares = posts.map((post) => ({
    id: String(post.id),
    user: {
      id: "unknown",
      name: "이웃",
      avatar: "/placeholder.svg",
      location: post.location,
    },
    title: post.title,
    description: "",
    price: post.price.toLocaleString() + "원",
    images: [post.thumbnailUrl],
    image: post.thumbnailUrl, // UserPost 타입 코환용
    createdAt: new Date().toISOString(), // UserPost 타입 호환용 (API에 시간 정보가 구체적이지 않으면 현재시간 or 임의값)
    place: post.location,
    timeAgo: post.timeAgo,
    likes: 0,
    chatCount: post.chatCount,
    status: (post.status === "SELLING" ? "available" : "completed") as "available" | "completed",
    isMyPost: (isLoggedIn && user && String(post.writerId) === String(user.id)) || false,
  }))

  const filteredShares = allShares.filter((share) => {
    const matchesSearch =
      share.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCompletedFilter = !hideCompleted || share.status !== "completed"
    return matchesSearch && matchesCompletedFilter
  })

  const totalPages = Math.max(1, Math.ceil(filteredShares.length / ITEMS_PER_PAGE))
  const paginatedShares = filteredShares.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const handleShareClick = (shareId: string) => {
    router.push(`/community/${shareId}`)
  }

  const handleLikeClick = (e: React.MouseEvent, share: (typeof allShares)[0]) => {
    e.stopPropagation()
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    toggleLikePost(e, share)
  }

  const isPostLiked = (postId: string) => {
    return likedPosts.some((p) => p.id === postId)
  }

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    router.push("/community/new")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <ScrollToTop />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8">
        {/* Header (텍스트 제거, 레이아웃 유지용 spacer) */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("nearby")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === "nearby" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              우리 동네
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === "all" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              전체 보기
            </button>
          </div>
        </div>


        {/* Search row + Create button (center-fixed, 700px) */}
        <div className="grid grid-cols-[1fr_minmax(0,700px)_1fr] items-center mb-6">
          {/* 왼쪽: 빈 공간(중앙 고정용) */}
          <div />

          {/* 가운데: 검색창 (항상 중앙, 폭 700px) */}
          <div className="relative w-full justify-self-center">
            <div className="flex items-center rounded-full border-2 border-[#800020] bg-background overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <Input
                placeholder="이웃과 나누고 싶은 재료를 검색해보세요"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="flex-1 border-0 h-12 px-5 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button size="icon" className="h-10 w-10 rounded-full bg-[#800020] hover:bg-[#800020]/90 mr-1">
                <Search className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {/* 오른쪽: N빵 팟 구함 버튼 */}
          <div className="justify-self-end">
            <Button className="gap-2 bg-[#800020] hover:bg-[#800020]/90" onClick={handleCreatePost}>
              <Plus className="h-4 w-4" />
              나눔 팟 구함
            </Button>
          </div>
        </div>


        <div className="flex items-center justify-end gap-2 mb-6">
          <Switch
            id="hide-completed"
            checked={hideCompleted}
            onCheckedChange={(checked) => {
              setHideCompleted(checked)
              setCurrentPage(1)
            }}
          />
          <Label htmlFor="hide-completed" className="text-sm text-muted-foreground cursor-pointer">
            거래완료 제외
          </Label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedShares.map((share) => (
            <div key={share.id} className="cursor-pointer group" onClick={() => handleShareClick(share.id)}>
              {/* 이미지 - 정사각형 비율 */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted mb-2">
                <Image
                  src={share.images[0] || "/placeholder.svg"}
                  alt={share.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                {share.isMyPost && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-[#800020] text-white hover:bg-[#800020]">내 나눔</Badge>
                  </div>
                )}
                {share.status === "completed" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">거래 완료</span>
                  </div>
                )}
              </div>

              {/* 상품명 */}
              <h3 className="font-medium text-sm leading-tight line-clamp-2 mb-1 text-foreground">{share.title}</h3>

              {/* 가격 */}
              <p className="font-bold text-base text-foreground mb-1">{share.price}</p>

              {/* 위치 · 시간 */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{share.place}</span>
                <span>·</span>
                <span>끌올 {share.timeAgo}</span>
              </div>
            </div>
          ))}
        </div>

        {paginatedShares.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={cn(
                "p-2 text-gray-400 transition-colors",
                currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:text-gray-600",
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "min-w-[40px] h-10 rounded-lg text-base font-medium transition-all",
                  currentPage === page
                    ? "border-2 border-[#800020] text-[#800020] bg-white"
                    : "text-gray-500 hover:bg-gray-100",
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={cn(
                "p-2 text-gray-400 transition-colors",
                currentPage === totalPages ? "opacity-30 cursor-not-allowed" : "hover:text-gray-600",
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
