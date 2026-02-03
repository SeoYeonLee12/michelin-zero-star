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
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
import Image from "next/image"
import { createPost, getPostDetail, updatePost } from "@/lib/api/market"
import { compressImage } from "@/lib/image-utils"

// URL을 File 객체로 변환하는 헬퍼 함수
async function urlToFile(url: string, filename: string, mimeType: string): Promise<File> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new File([blob], filename, { type: mimeType })
}

function CommunityNewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams.get("id")
  const isEditMode = !!postId

  const { isLoggedIn, isLoading: authLoading } = useAuth()
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
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login")
    }
  }, [authLoading, isLoggedIn, router])

  // 수정 모드일 때 데이터 불러오기
  useEffect(() => {
    if (authLoading) return // 토큰 복구 대기

    if (isEditMode && postId) {
      setLoading(true)
      getPostDetail(postId)
        .then((post) => {
          // 백엔드 응답 필드 확인을 위해 로그 출력
          // 만약 isOwner가 없고 owner가 있다면...
          const hasAuthority = post.isOwner || (post as any).owner

          if (!hasAuthority) {
            alert("수정 권한이 없습니다.")
            router.push("/community")
            return
          }
          setFormData({
            title: post.title,
            description: post.content,
            price: post.price.toLocaleString(),
            place: post.meetingPlace || "",
          })
          setImages(post.imageUrls || [])
          setExistingImageUrls(post.imageUrls || [])
        })
        .catch((err) => {
          console.error("Failed to fetch post", err)
          alert("게시글 정보를 불러오는데 실패했습니다.")
          router.push("/community")
        })
        .finally(() => setLoading(false))
    }
  }, [authLoading, isEditMode, postId, router])

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
    setShowConfirmDialog(true)
  }

  const confirmSubmit = async () => {
    try {
      setLoading(true)

      // 최종 전송할 파일 리스트 구성
      const finalFiles: File[] = []

      // 1. 기존 이미지 중 현재 images 배열에 남아있는 것들을 File 객체로 변환
      //    (existingImageUrls는 초기 로드 시점의 이미지 목록이므로,
      //     images 배열에 남아있는 http URL만 고려)
      for (const imgUrl of images) {
        if (!imgUrl.startsWith("data:")) {
          // 기존 이미지 (http URL)
          try {
            // 파일명 추출 또는 임의 지정
            const filename = imgUrl.split("/").pop() || "existing_image.jpg"
            const file = await urlToFile(imgUrl, filename, "image/jpeg") // 타입은 대략 추정
            finalFiles.push(file)
          } catch (e) {
            console.error("Failed to convert existing image to file", e)
            // 변환 실패 시 해당 이미지는 전송하지 않음
          }
        }
      }

      // 2. 새로 추가된 파일들도 finalFiles에 합침
      //    files 상태에는 새로 업로드된 File 객체들이 들어있음.
      finalFiles.push(...files)

      // API 호출
      // API 호출 - Create용 데이터 (category 포함)
      const createApiData = {
        title: formData.title,
        content: formData.description,
        price: Number(formData.price.replace(/,/g, "")) || 0,
        meetingPlace: formData.place || "",
        category: "SHARE",
      }

      // API 호출 - Update용 데이터 (category 제외)
      const updateApiData = {
        title: formData.title,
        content: formData.description,
        price: Number(formData.price.replace(/,/g, "")) || 0,
        meetingPlace: formData.place || "",
        // category excluded for update just in case backend rejects it
      }

      console.log("Submit Payload:", { isEditMode, postId, filesCount: finalFiles.length })

      if (isEditMode && postId) {
        await updatePost(postId, updateApiData, finalFiles)
        alert("게시글이 수정되었습니다.")
        router.push(`/community/${postId}`) // 수정 후 상세 페이지로 이동
      } else {
        await createPost(createApiData, finalFiles)
        alert("게시글이 등록되었습니다.")
        router.push("/community")
      }
    } catch (error: any) {
      console.error("게시글 저장 실패:", error)
      const errorMessage = error.message || "알 수 없는 오류가 발생했습니다."
      alert(`게시글 저장 실패: ${errorMessage}`)
    } finally {
      setLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const handleCancel = () => {
    if (formData.title || formData.description || images.length > 0) {
      setShowExitDialog(true)
    } else {
      router.push(isEditMode && postId ? `/community/${postId}` : "/community")
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
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditMode ? "게시글 수정" : "N빵 팟 구함"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? "등록된 정보를 수정하세요" : "이웃과 재료를 나눠보세요"}
            </p>
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
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="구매한 재료, 상태, 나눔 방법 등을 자세히 적어주세요.&#10;&#10;예시:&#10;- 오늘 마트에서 구매한 신선한 양배추예요&#10;- 반 통씩 나눠서 가져가시면 됩니다&#10;- 둔산동 롯데마트 앞에서 직거래 원해요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">가격</Label>
              <Input
                id="price"
                placeholder="예: 1,000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            {/* Place */}
            <div className="space-y-2">
              <Label htmlFor="place">거래 장소</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="place"
                  placeholder="예: 둔산동 롯데마트 앞"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCancel}>
            취소
          </Button>
          <Button className="flex-1 bg-[#800020] hover:bg-[#800020]/90" onClick={handleSubmit} disabled={loading}>
            {loading ? "저장 중..." : (isEditMode ? "수정하기" : "등록하기")}
          </Button>
        </div>
      </main>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0">
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
              onClick={() => router.push(isEditMode && postId ? `/community/${postId}` : "/community")}
              className="bg-destructive hover:bg-destructive/90"
            >
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function CommunityNewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CommunityNewForm />
    </Suspense>
  )
}
