"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { compressImage } from "@/lib/image-utils"  // ✅ import 추가
import { cn } from "@/lib/utils"

import { getPostDetail, updatePost } from "@/lib/api/market"

export default function CommunityEditPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const params = useParams<{ id: string }>()
  const postId = params.id

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    place: "",
  })
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])  // ✅ 새로 업로드할 이미지
  const [loading, setLoading] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Validation States
  const [titleError, setTitleError] = useState<string | null>(null)
  const [descError, setDescError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    async function fetchPost() {
      try {
        const post = await getPostDetail(postId)
        if (post) {
          // 본인 게시글인지 확인
          if (!post.isOwner) {
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
          setExistingImages(post.imageUrls || [])  // ✅ setImages → setExistingImages
        }
      } catch (error) {
        console.error("Failed to fetch post", error)
        router.push("/community")
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [isLoggedIn, postId, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    // 이미지 압축
    const validFiles = selectedFiles.filter(file => {
      if (!file.type.startsWith("image/")) {
        setImageError("이미지 파일만 업로드할 수 있습니다.")
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setImageError(null)
    } else {
      return
    }

    const compressedFiles = await Promise.all(
      validFiles.map((file) => compressImage(file))
    )

    setFiles((prev) => [...prev, ...compressedFiles])
    // 기존 이미지는 제거 (새 이미지로 완전 교체)
    setExistingImages([])
  }

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    let isValid = true

    // Clear errors
    setTitleError(null)
    setDescError(null)
    setPlaceError(null)

    if (!formData.title || formData.title.length < 2) {
      setTitleError("제목은 2자 이상 입력해주세요.")
      isValid = false
    }

    if (!formData.description || formData.description.length < 5) {
      setDescError("내용은 5자 이상 입력해주세요.")
      isValid = false
    }

    // Validate Place (if required, matching new page logic)
    if (!formData.place) {
      setPlaceError("거래 장소를 입력해주세요.")
      isValid = false
    } else if (formData.place.length > 30) {
      setPlaceError("거래 장소는 30자 이내로 입력해주세요.")
      isValid = false
    }

    if (!isValid) return

    setShowConfirmDialog(true)
  }

  const confirmSubmit = async () => {
    try {
      await updatePost(
        postId,
        {
          title: formData.title,
          content: formData.description,
          price: parseInt(formData.price.replace(/[^0-9]/g, "")) || 0,
          meetingPlace: formData.place,
        },
        files,
        existingImages
      )
      alert("게시글이 수정되었습니다.")
      router.push(`/community/${postId}`)
    } catch (error) {
      console.error("Update failed", error)
      alert("수정 실패")
    }
    setShowConfirmDialog(false)
  }

  const handleCancel = () => {
    setShowExitDialog(true)
  }

  if (!isLoggedIn || loading) return null // Loading indicator can be added

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
            <h1 className="text-2xl font-bold tracking-tight">게시물 수정</h1>
            <p className="text-muted-foreground">나눔 게시물 정보를 수정하세요</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>
                이미지 <span className="text-muted-foreground text-sm">(선택사항)</span>
              </Label>              <div className="flex flex-wrap gap-3">
                {/* 기존 이미지 표시 */}
                {existingImages.map((img: string, idx: number) => (
                  <div key={`existing-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`기존 이미지 ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-1 left-1 text-xs">기존</Badge>
                  </div>
                ))}
                {/* 새로 업로드한 이미지 표시 */}
                {files.map((file: File, idx: number) => (
                  <div key={`new-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`새 이미지 ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">추가</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
              {files.length > 0 && (
                <p className="text-sm text-yellow-600">새 이미지를 업로드하면 기존 이미지가 모두 삭제됩니다.</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="예: 양배추 반 통 같이 나눠요 (2~40자)"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  if (e.target.value.length >= 2) setTitleError(null)
                }}
                maxLength={40}
                className={cn(titleError && "border-red-500 focus-visible:ring-red-500")}
              />
              {titleError && <p className="text-red-500 text-xs mt-1">{titleError}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="구매한 재료, 상태, 나눔 방법 등을 자세히 적어주세요."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  if (e.target.value.length >= 5) setDescError(null)
                }}
                rows={6}
                maxLength={150}
                className={cn(descError && "border-red-500 focus-visible:ring-red-500")}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-red-500 min-h-[16px]">{descError}</span>
                <span className="text-xs text-muted-foreground">
                  {formData.description.length}/150
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">가격 (숫자만 입력)</Label>
              <Input
                id="price"
                placeholder="예: 1000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                type="number"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place">거래 장소</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="place"
                  placeholder="예: 둔산동 롯데마트 앞"
                  value={formData.place}
                  onChange={(e) => {
                    setFormData({ ...formData, place: e.target.value })
                    if (e.target.value) setPlaceError(null)
                  }}
                  className={cn("pl-10", placeError && "border-red-500 focus-visible:ring-red-500")}
                  maxLength={30}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-red-500 min-h-[16px]">{placeError}</span>
                <span className="text-xs text-muted-foreground">
                  {formData.place.length} / 30
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCancel}>
            취소
          </Button>
          <Button className="flex-1 bg-[#800020] hover:bg-[#800020]/90" onClick={handleSubmit}>
            저장하기
          </Button>
        </div>
      </main>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시물 수정</AlertDialogTitle>
            <AlertDialogDescription>변경사항을 저장하시겠습니까?</AlertDialogDescription>
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
            <AlertDialogTitle>수정을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>변경사항이 저장되지 않습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 수정</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push(`/community/${postId}`)}
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
