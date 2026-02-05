// frontend/app/community/new/page.tsx

"use client"

import type React from "react"
import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { ScrollToTop } from "@/components/cook-sync/scroll-to-top"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Upload, X, MapPin, Receipt } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { createPost, getPostDetail, updatePost } from "@/lib/api/market"
import { compressImage } from "@/lib/image-utils"
import { StarRewardBadge } from "@/components/cook-sync/star-reward-badge"
import { AnimatePresence, motion } from "framer-motion"

// URL을 File 객체로 변환하는 헬퍼 함수
async function urlToFile(url: string, filename: string, mimeType: string): Promise<File> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new File([blob], filename, { type: mimeType })
}

function CommunityNewForm() {
  const router = useRouter()
  const { isLoggedIn, addUserPost, earnStars } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    place: "",
  })
  const [images, setImages] = useState<string[]>([]) // 미리보기용 URL 리스트 (기존 URL + 새 파일 blob URL)
  const [files, setFiles] = useState<File[]>([]) // 새로 업로드된 파일 객체들
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]) // 처음에 불러온 기존 이미지 URL들 (수정 시 비교용)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdPostId, setCreatedPostId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isFree, setIsFree] = useState(false)
  const [loading, setLoading] = useState(false)
  // Edit Mode Logic
  const searchParams = useSearchParams()
  const editPostId = searchParams.get("edit")
  const isEditMode = !!editPostId

  useEffect(() => {
    if (isEditMode && editPostId && isLoggedIn) {
      const fetchPost = async () => {
        try {
          const post = await getPostDetail(editPostId)
          if (post) {
            // 본인 게시글인지 확인 (API에 owner 필드가 있다고 가정)
            const hasAuthority = post.isOwner || (post as any).owner;
            if (!hasAuthority) {
              alert("수정 권한이 없습니다.")
              router.push("/community")
              return
            }

            const isFreePost = post.price === 0
            setIsFree(isFreePost)

            setFormData({
              title: post.title,
              description: post.content, // API field usually content
              price: isFreePost ? "무료 나눔" : String(post.price),
              place: post.meetingPlace || post.location || "",
            })
            if (post.imageUrls) {
              setImages(post.imageUrls)
            }
          }
        } catch (error) {
          console.error("Failed to fetch post for edit:", error)
        }
      }
      fetchPost()
    }
  }, [isEditMode, editPostId, isLoggedIn, router])

  const handleFreeChange = (checked: boolean) => {
    setIsFree(checked)
    if (checked) {
      setFormData((prev) => ({ ...prev, price: "무료 나눔" }))
    } else {
      setFormData((prev) => ({ ...prev, price: "" }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    const remainingSlots = 5 - images.length
    const filesToProcess = Array.from(fileList).slice(0, remainingSlots)

    filesToProcess.forEach(async (file) => {
      // 1. 이미지 압축
      try {
        const compressedFile = await compressImage(file)

        // 2. 미리보기용 base64
        const reader = new FileReader()
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(compressedFile)

        // 3. 전송용 File 객체
        setFiles((prev) => [...prev, compressedFile])
      } catch (e) {
        console.error("Image compression failed", e)
        alert("이미지 처리 중 오류가 발생했습니다.")
      }
    })
  }

  const removeImage = (index: number) => {
    // images 배열에서 해당 인덱스의 이미지를 제거
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)

    // 만약 제거된 이미지가 기존 이미지였다면 existingImageUrls에서도 제거
    const removedImageUrl = images[index]
    if (!removedImageUrl.startsWith("data:")) {
      setExistingImageUrls((prev) => prev.filter((url) => url !== removedImageUrl))
    } else {
      // 제거된 이미지가 새로 추가된 이미지(data URL)였다면, files 배열에서도 제거
      // files 배열은 새로 추가된 이미지들의 File 객체를 순서대로 가지고 있음.
      // images 배열에서 data URL인 것들만 필터링하여 files 배열의 인덱스를 찾음.
      const newImageUrlsInImages = images.filter((url) => url.startsWith("data:"))
      const removedNewImageIndex = newImageUrlsInImages.indexOf(removedImageUrl)
      if (removedNewImageIndex !== -1) {
        setFiles((prev) => prev.filter((_, i) => i !== removedNewImageIndex))
      }
    }
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      alert("제목과 내용을 입력해주세요.")
      return
    }
    if (formData.title.length < 2 || formData.title.length > 40) {
      alert("제목은 2자 이상 40자 이하로 입력해주세요.")
      return
    }
    if (formData.description.length < 5 || formData.description.length > 150) {
      alert("내용은 5자 이상 150자 이하로 상세히 작성해주세요.")
      return
    }

    if (!isFree && !formData.price) {
      alert("가격을 입력하거나 무료 나눔을 선택해주세요.")
      return
    }

    if (!formData.place) {
      alert("거래 장소를 입력해주세요.")
      return
    }

    if (formData.place.length > 30) {
      alert("거래 장소는 30자 이내로 입력해주세요.")
      return
    }

    setShowConfirmDialog(true)
  }

  const confirmSubmit = async () => {
    try {
      const priceValue = isFree ? 0 : parseInt(formData.price.toString().replace(/,/g, "")) || 0

      if (priceValue < 0) {
        alert("가격은 0원 이상이어야 합니다.")
        return
      }

      if (isEditMode && editPostId) {
        // 수정 로직
        const existingImageUrls = images.filter(img => !img.startsWith("data:"))

        await updatePost(
          editPostId,
          {
            title: formData.title,
            content: formData.description,
            price: priceValue,
            meetingPlace: formData.place
          },
          files,
          existingImageUrls
        )
        alert("게시글이 수정되었습니다.")
        router.push(`/community/${editPostId}`)
      } else {
        // 생성 로직
        const result = await createPost(
          {
            title: formData.title,
            content: formData.description,
            price: priceValue,
            meetingPlace: formData.place || "장소 협의",
          },
          files,
        )
        // result가 ID라고 가정하고 파싱 시도 (숫자가 아니면 무시)
        const newPostId = Number(result)
        if (!isNaN(newPostId)) {
          setCreatedPostId(newPostId)
        }

        setShowSuccessDialog(true)
      }
    } catch (error: any) {
      console.error("게시글 처리 실패:", error)
      alert(`게시글 ${isEditMode ? "수정" : "등록"}에 실패했습니다: ${error.message}`)

    } finally {
      setLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const handleViewPost = () => {
    if (createdPostId) {
      router.push(`/community/${createdPostId}`)
    } else {
      router.push("/community")
    }
  }

  const handleCancel = () => {
    // 수정 모드일 때는 상세 페이지로, 생성 모드일 때는 목록으로 이동
    const targetPath = isEditMode && editPostId ? `/community/${editPostId}` : "/community"

    if (formData.title || formData.description || images.length > 0) {
      setShowExitDialog(true)
    } else {
      router.push(targetPath)
    }
  }

  if (loading && !formData.title && isEditMode) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <ScrollToTop />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditMode ? "게시물 수정" : "나눔 팟 구함"}</h1>
            <p className="text-muted-foreground">{isEditMode ? "나눔 게시물 정보를 수정하세요" : "이웃과 재료를 나눠보세요"}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>
                이미지 <span className="text-muted-foreground text-sm">(최대 5장)</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Image ${idx + 1}`}
                      fill
                      className="object-cover cursor-pointer"
                      onClick={() => setPreviewImage(img)}
                    />
                    {/* First image tag */}
                    {idx === 0 && (
                      <Badge className="absolute top-1 left-1 bg-[#800020] text-white text-[10px] px-1.5 py-0.5">
                        대표
                      </Badge>
                    )}
                    {/* Prevent deletion in edit mode if needed, or allow? Existing edit page disallowed image edits */}
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-[#800020] hover:text-[#800020] transition-colors"
                  >
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">추가</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                <Receipt className="h-4 w-4 shrink-0" />
                <span>신뢰를 위해 영수증을 함께 첨부해보세요</span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="예: 양배추 반 통 같이 나눠요"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={40}
                className={formData.title.length === 40 ? "focus-visible:ring-amber-500 ring-1 ring-amber-500" : ""}
              />
              <div className="flex justify-end mt-1">
                <span className={cn("text-xs", formData.title.length === 40 ? "text-amber-500 font-medium" : "text-muted-foreground")}>
                  {formData.title.length} / 40
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder={`구매한 재료, 상태, 나눔 방법 등을 자세히 적어주세요.
    
    예시:
    - 오늘 마트에서 구매한 신선한 양배추예요
    - 반 통씩 나눠서 가져가시면 됩니다
    - 둔산동 롯데마트 앞에서 직거래 원해요`}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                maxLength={150}
                className={formData.description.length === 150 ? "focus-visible:ring-amber-500 ring-1 ring-amber-500" : ""}
              />
              <div className="flex justify-end mt-1">
                <span className={cn("text-xs", formData.description.length === 150 ? "text-amber-500 font-medium" : "text-muted-foreground")}>
                  {formData.description.length} / 150
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="price">
                  가격 <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="free-sharing"
                    checked={isFree}
                    onCheckedChange={handleFreeChange}
                  />
                  <Label
                    htmlFor="free-sharing"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    무료 나눔
                  </Label>
                </div>
              </div>
              <Input
                id="price"
                placeholder="예: 1,000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={isFree}
              />
            </div>

            {/* Place */}
            <div className="space-y-2">
              <Label htmlFor="place">
                거래 장소 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="place"
                  placeholder="예: 둔산동 롯데마트 앞"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  maxLength={30}
                  className={cn("pl-10", formData.place.length === 30 ? "focus-visible:ring-amber-500 ring-1 ring-amber-500" : "")}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className={cn("text-xs", formData.place.length === 30 ? "text-amber-500 font-medium" : "text-muted-foreground")}>
                  {formData.place.length} / 30
                </span>
              </div>
            </div>
          </CardContent>
        </Card >

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCancel}>
            취소
          </Button>
          <Button className="flex-1 bg-[#800020] hover:bg-[#800020]/90" onClick={handleSubmit}>
            {isEditMode ? "저장하기" : "등록하기"}
          </Button>
        </div >
      </main >

      {/* Image Preview Dialog */}
      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogTitle className="sr-only">이미지 미리보기</DialogTitle>
          {previewImage && (
            <Image
              src={previewImage || "/placeholder.svg"}
              alt="Preview"
              width={800}
              height={600}
              className="w-full h-auto object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEditMode ? "게시글 수정" : "게시글 등록"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditMode ? "게시글을 수정하시겠습니까?" : "게시글을 등록하시겠습니까?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니오</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="bg-[#800020] hover:bg-[#800020]/90">
              예
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 중인 내용이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              페이지를 떠나면 작성 중인 내용이 사라집니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push("/community")}
              className="bg-[#800020] hover:bg-[#800020]/90"
            >
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AnimatePresence>
        {showSuccessDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleViewPost}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[340px] bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-center overflow-hidden border border-gray-50"
            >
              <div className="relative space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">게시글 등록 성공!</h2>
                  <p className="text-gray-400 text-sm font-medium">작성하신 나눔 게시글이 등록되었습니다.</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setShowSuccessDialog(false)}
                  >
                    계속 등록하기
                  </Button>
                  <Button
                    className="flex-1 bg-[#800020] hover:bg-[#800020]/90 text-white font-semibold shadow-sm"
                    onClick={handleViewPost}
                  >
                    내 게시글 보기
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  )
}

export default function CommunityNewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CommunityNewForm />
    </Suspense>
  )
}
