"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { RecipeCard } from "@/components/cook-sync/recipe-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Heart,
  Edit,
  Camera,
  BookOpen,
  FileText,
  Info,
  MoreVertical,
  Trash2,
  CheckCircle,
  Bookmark,
  ChefHat,
  Users,
  ThumbsUp,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getPostList, deletePost, updatePost } from "@/lib/api/market" // Import APIs
import Link from "next/link"
import Image from "next/image"

/** ✅ 탭 안내 박스 공통 컴포넌트 */
function TabInfoBox({
                      icon: Icon,
                      title,
                      description,
                    }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
      <div className="flex items-center gap-3 border-b pb-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#800020]/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#800020]" />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
  )
}

export default function MyPage() {
  const router = useRouter()
  const {
    user,
    isLoggedIn,
    isLoading, // ✅ 로딩 상태 가져오기
    likedRecipes,
    toggleLikeRecipe,
    userRecipes,
    // userPosts, // Context에서 제거됨 -> 로컬 State로 대체
    deleteUserRecipe,
    // deleteUserPost, // Context에서 제거됨
    // updateUserPost, // Context에서 제거됨
    likedPosts,
  } = useAuth()

  const [activeTab, setActiveTab] = React.useState("saved")
  const [starInfoOpen, setStarInfoOpen] = React.useState(false)
  const [deleteRecipeDialogOpen, setDeleteRecipeDialogOpen] = React.useState(false)
  const [deletePostDialogOpen, setDeletePostDialogOpen] = React.useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null)
  const [selectedPostId, setSelectedPostId] = React.useState<string | null>(null)
  const [animatedStars, setAnimatedStars] = React.useState(0)

  // ✅ Real Data State (Context 대신 사용)
  const [myPosts, setMyPosts] = React.useState<any[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(false)

  // ✅ 로딩이 끝난 후에만 리다이렉트 체크 (깜빡임 방지)
  React.useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoading, isLoggedIn, router])

  // ✅ 내 나눔글 가져오기 (API 연동)
  React.useEffect(() => {
    async function fetchMyPosts() {
      if (!user || !user.id) return
      setIsLoadingPosts(true)
      try {
        // const allPosts = await getPostList()
        // const filtered = allPosts.filter(p => String(p.writerId) === String(user.id))
        // setMyPosts(filtered)
        setMyPosts([]) // 현재 백엔드 미지원으로 빈 배열 처리 (필요시 주석 해제)
      } catch (e) {
        console.error("Failed to fetch my posts", e)
      } finally {
        setIsLoadingPosts(false)
      }
    }

    if (activeTab === "myPosts") {
      fetchMyPosts()
    }
  }, [activeTab, user])

  // 별 애니메이션
  React.useEffect(() => {
    if (isLoggedIn && user?.stars !== undefined) {
      const targetStars = user.stars
      const duration = 1500
      const steps = 60
      const increment = targetStars / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= targetStars) {
          setAnimatedStars(targetStars)
          clearInterval(timer)
        } else {
          setAnimatedStars(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [isLoggedIn, user?.stars])

  // ✅ 로딩 중일 때 화면 렌더링 방지
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">로딩 중...</div>
  }

  if (!isLoggedIn) return null

  const totalStars = user?.stars || 0
  const todayRemaining = 3 - (user?.todayStars || 0)

  const handleDeleteRecipe = () => {
    if (!selectedRecipeId) return
    deleteUserRecipe(selectedRecipeId)
    setDeleteRecipeDialogOpen(false)
    setSelectedRecipeId(null)
  }

  const handleDeletePost = async () => {
    if (!selectedPostId) return
    try {
      await deletePost(selectedPostId)
      setMyPosts(prev => prev.filter(p => String(p.id) !== selectedPostId)) // 낙관적 업데이트
      alert("게시글이 삭제되었습니다.")
    } catch (e) {
      console.error("Failed to delete post", e)
      alert("삭제 실패")
    }
    setDeletePostDialogOpen(false)
    setSelectedPostId(null)
  }

  const handleTogglePostStatus = async (postId: string, currentStatus: string) => {
    alert("상태 변경 기능은 상세 페이지를 통해 확인해주세요. (현재 API 제한)")
  }

  const tabInfo = {
    saved: {
      icon: Bookmark,
      title: "저장한 레시피",
      description: "하트를 눌러 저장한 레시피 목록",
      emptyTitle: "아직 저장한 레시피가 없어요",
    },
    myRecipes: {
      icon: ChefHat,
      title: "내가 등록한 레시피",
      description: "직접 만들어 공유한 나만의 레시피",
      emptyTitle: "아직 등록한 레시피가 없어요",
    },
    myPosts: {
      icon: Users,
      title: "내가 작성한 나눔글",
      description: "재료 나눔을 위해 작성한 게시물",
      emptyTitle: "아직 작성한 글이 없어요",
    },
    likedPosts: {
      icon: ThumbsUp,
      title: "관심 있는 나눔글",
      description: "하트를 눌러 관심 표시한 게시물",
      emptyTitle: "아직 좋아요한 게시물이 없어요",
    },
  } as const

  return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        <main className="container max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <Card className="mb-8 border rounded-xl overflow-hidden bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 bg-white divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* 좌측 프로필 정보 박스 */}
                <div className="p-8 flex flex-col items-center sm:items-start justify-center">
                  <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
                    <div className="relative shrink-0">
                      <Avatar className="h-24 w-24 border">
                        <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                        <AvatarFallback className="text-xl bg-muted">
                          {user?.nickname?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-foreground truncate">{user?.nickname || "사용자"}</h1>
                        <Badge className="gap-1 bg-[#800020]/5 text-[#800020] border-[#800020]/20 px-2 py-0.5 shrink-0">
                          <Image src="/michelin-star.png" alt="star" width={12} height={12} />
                          <span className="text-xs font-semibold">미슐랭 {totalStars}스타</span>
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground p-0 ml-1" asChild>
                          <Link href="/profile">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {user?.bio || "매일 조금씩 요리 실력을 키워가고 있어요!"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 우측 별 게이지 박스 */}
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-end justify-between mb-8">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-bold text-foreground">내 스타</span>
                      <Collapsible open={starInfoOpen} onOpenChange={setStarInfoOpen}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="absolute z-50 mt-2 w-64 bg-white border rounded-lg shadow-xl p-4">
                          <div className="space-y-3 text-sm">
                            <div className="p-2 bg-muted rounded-lg">
                              <p className="font-medium mb-1">스타 획득 방법</p>
                              <ul className="space-y-0.5 text-muted-foreground text-xs">
                                <li>• 요리 완료: 0.5개</li>
                                <li>• 레시피 등록: 1개</li>
                                {/* <li>• 나눔 완료: 1개</li> */}
                              </ul>
                            </div>
                            <div className="p-2 bg-muted rounded-lg">
                              <p className="font-medium mb-1">일일 제한</p>
                              <p className="text-muted-foreground text-xs">하루 최대 3개까지 획득 가능</p>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-bold text-[#800020]">{totalStars}개</span>
                      <Image src="/michelin-star.png" alt="Star Icon" width={24} height={24} className="object-contain" />
                    </div>
                  </div>

                  <div className="relative w-full">
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                          className="h-full bg-[#800020] rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min((animatedStars / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="mt-4 text-right text-[11px] text-muted-foreground">
                      오늘 <span className="font-bold text-[#800020]">{todayRemaining}개</span> 더 획득할 수 있어요!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ✅ Tabs 레이아웃 시작 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row gap-8 items-start relative mt-8">

              {/* [좌측 사이드바] 스크롤 시 상단 고정 */}
              <aside className="hidden md:block w-1/5 sticky top-24 shrink-0">
                <div className="flex flex-col space-y-1 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                  {[
                    { id: "saved", label: "저장한 레시피", icon: Bookmark },
                    { id: "myRecipes", label: "내 레시피", icon: ChefHat },
                    { id: "myPosts", label: "내 나눔", icon: FileText },
                    { id: "likedPosts", label: "관심 있는 나눔", icon: Heart },
                  ].map((item) => (
                      <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${activeTab === item.id
                              ? "bg-white text-[#800020] shadow-sm border border-gray-100 font-bold"
                              : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                          }
                    `}
                      >
                        <item.icon className={`h-4 w-4 ${activeTab === item.id ? "text-[#800020]" : ""}`} />
                        {item.label}
                      </button>
                  ))}
                </div>
              </aside>

              {/* [우측 컨텐츠 영역] */}
              <div className="w-full md:w-4/5 min-w-0">
                {/* 모바일 탭 메뉴 */}
                <div className="md:hidden flex justify-center mb-6">
                  <TabsList className="bg-white border-b w-full justify-start overflow-x-auto h-12 p-0 rounded-none shadow-none">
                    <TabsTrigger value="saved" className="flex-1">저장</TabsTrigger>
                    <TabsTrigger value="myRecipes" className="flex-1">내 레시피</TabsTrigger>
                    <TabsTrigger value="myPosts" className="flex-1">내 나눔</TabsTrigger>
                    <TabsTrigger value="likedPosts" className="flex-1">관심</TabsTrigger>
                  </TabsList>
                </div>

                {/* 저장한 레시피 */}
                <TabsContent value="saved" className="space-y-4 outline-none m-0">
                  <TabInfoBox icon={tabInfo.saved.icon} title={tabInfo.saved.title} description={tabInfo.saved.description} />
                  {likedRecipes.length === 0 ? (
                      <Card><CardContent className="p-8 text-center">
                        <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">{tabInfo.saved.emptyTitle}</p>
                        <Button className="mt-4 bg-[#800020]" onClick={() => router.push("/recipes")}>레시피 둘러보기</Button>
                      </CardContent></Card>
                  ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {likedRecipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={{ ...recipe, name: recipe.title || recipe.name }} isLiked={true} onHeartClick={() => toggleLikeRecipe(recipe)} onClick={() => router.push(`/recipes/${recipe.id}`)} />
                        ))}
                      </div>
                  )}
                </TabsContent>

                {/* 내 레시피 */}
                <TabsContent value="myRecipes" className="space-y-4 outline-none m-0">
                  <TabInfoBox icon={tabInfo.myRecipes.icon} title={tabInfo.myRecipes.title} description={tabInfo.myRecipes.description} />
                  <div className="flex justify-end mb-2">
                    <Button variant="link" className="text-[#800020]" onClick={() => router.push("/recipes/new")}>새 레시피 등록</Button>
                  </div>
                  {userRecipes.length === 0 ? (
                      <Card><CardContent className="p-8 text-center">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">아직 등록한 레시피가 없어요</p>
                        <Button className="mt-4 bg-[#800020]" onClick={() => router.push("/recipes/new")}>레시피 등록하기</Button>
                      </CardContent></Card>
                  ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {userRecipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={{ ...recipe, isUserRecipe: true, name: recipe.title, image: recipe.thumbnail, hashtags: recipe.tags }} onEdit={() => router.push(`/recipes/edit/${recipe.id}`)} onDelete={() => { setSelectedRecipeId(recipe.id); setDeleteRecipeDialogOpen(true); }} onClick={() => router.push(`/recipes/${recipe.id}`)} />
                        ))}
                      </div>
                  )}
                </TabsContent>

                {/* 내 나눔글 (API 연동 버전) */}
                <TabsContent value="myPosts" className="space-y-4 outline-none m-0">
                  <TabInfoBox icon={tabInfo.myPosts.icon} title={tabInfo.myPosts.title} description={tabInfo.myPosts.description} />
                  <div className="flex justify-end mb-2">
                    <Button variant="link" className="text-[#800020]" onClick={() => router.push("/community/new")}>새 글 작성</Button>
                  </div>
                  {isLoadingPosts ? (
                      <div className="p-12 text-center text-muted-foreground">로딩 중...</div>
                  ) : myPosts.length === 0 ? (
                      <Card><CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">작성한 나눔글이 없습니다.</p>
                      </CardContent></Card>
                  ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {myPosts.map((post) => (
                            <div key={post.id} className="cursor-pointer group" onClick={() => router.push(`/community/${post.id}`)}>
                              <div className="relative aspect-[4/3] overflow-hidden bg-muted rounded-lg mb-2">
                                <Image src={post.thumbnailUrl || "/placeholder.svg"} alt={post.title} fill className="object-cover transition-transform group-hover:scale-105" />
                                {post.status === "COMPLETED" && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white text-sm">거래 완료</span></div>}
                                <div className="absolute top-2 right-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button size="icon" variant="secondary" className="h-7 w-7 rounded-full bg-white/80" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePostStatus(String(post.id), post.status || "available"); }}><CheckCircle className="h-4 w-4 mr-2" />상태 변경</DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/community/edit/${post.id}`) }}><Edit className="h-4 w-4 mr-2" />수정</DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedPostId(String(post.id)); setDeletePostDialogOpen(true); }}><Trash2 className="h-4 w-4 mr-2" />삭제</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <h3 className="font-medium text-sm line-clamp-2">{post.title}</h3>
                              <p className="font-bold text-[#800020]">{post.price ? Number(post.price).toLocaleString() : 0}원</p>
                            </div>
                        ))}
                      </div>
                  )}
                </TabsContent>

                {/* 관심있는 나눔 */}
                <TabsContent value="likedPosts" className="space-y-4 outline-none m-0">
                  <TabInfoBox icon={tabInfo.likedPosts.icon} title={tabInfo.likedPosts.title} description={tabInfo.likedPosts.description} />
                  {likedPosts.length === 0 ? (
                      <Card><CardContent className="p-8 text-center">
                        <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">좋아요한 나눔글이 없습니다.</p>
                      </CardContent></Card>
                  ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {likedPosts.map((post) => (
                            <div key={post.id} className="cursor-pointer group" onClick={() => router.push(`/community/${post.id}`)}>
                              <div className="relative aspect-[4/3] overflow-hidden bg-muted rounded-lg mb-2">
                                <Image src={(post as any).image || "/placeholder.svg"} alt={(post as any).title} fill className="object-cover" />
                              </div>
                              <h3 className="font-medium text-sm line-clamp-2">{(post as any).title}</h3>
                              <p className="font-bold text-[#800020]">{(post as any).price}</p>
                            </div>
                        ))}
                      </div>
                  )}
                </TabsContent>
              </div>
            </div>
          </Tabs>

          {/* Delete Dialogs */}
          <Dialog open={deleteRecipeDialogOpen} onOpenChange={setDeleteRecipeDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>레시피 삭제</DialogTitle><DialogDescription>정말 삭제하시겠습니까?</DialogDescription></DialogHeader>
              <DialogFooter><Button variant="outline" onClick={() => setDeleteRecipeDialogOpen(false)}>아니요</Button><Button variant="destructive" onClick={handleDeleteRecipe}>삭제</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deletePostDialogOpen} onOpenChange={setDeletePostDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>게시글 삭제</DialogTitle><DialogDescription>정말 삭제하시겠습니까?</DialogDescription></DialogHeader>
              <DialogFooter><Button variant="outline" onClick={() => setDeletePostDialogOpen(false)}>아니요</Button><Button variant="destructive" onClick={handleDeletePost}>삭제</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </main>

        <style jsx global>{`
        @keyframes bounceUpDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      </div>
  )
}