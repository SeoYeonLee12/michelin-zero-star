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

import { getPostDetail, updatePost } from "@/lib/api/market"

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { isLoggedIn } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    place: "",
  })
  const [images, setImages] = useState<string[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
          if (!post.owner) {
            alert("수정 권한이 없습니다.")
            router.push("/community")
            return
          }

          setFormData({
            title: post.title,
            description: post.content, // API field is content
            price: String(post.price),
            place: post.meetingPlace || post.location,
          })
          if (post.imageUrls) {
            setImages(post.imageUrls)
          }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 이미지 수정 기능 미지원 (API 제한)
    alert("현재 이미지 수정은 지원하지 않습니다.")
  }

  const removeImage = (index: number) => {
    // 이미지 수정 기능 미지원
    alert("현재 이미지 수정은 지원하지 않습니다.")
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
      await updatePost(postId, {
        title: formData.title,
        content: formData.description,
        price: parseInt(formData.price.replace(/[^0-9]/g, "")) || 0,
        meetingPlace: formData.place
      })
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
            <p className="text-muted-foreground">N빵 게시물 정보를 수정하세요</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload - Read Only */}
            <div className="space-y-2 opacity-60 pointer-events-none">
              <Label>
                이미지 <span className="text-muted-foreground text-sm">(수정 불가)</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Image ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
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
                placeholder="구매한 재료, 상태, 나눔 방법 등을 자세히 적어주세요."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">가격 (숫자만 입력)</Label>
              <Input
                id="price"
                placeholder="예: 1000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
