"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { Camera, ArrowLeft, Eye, EyeOff, Check, X, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"

const categoryOptions = [
  { value: "korean", label: "한식" },
  { value: "chinese", label: "중식" },
  { value: "japanese", label: "일식" },
  { value: "western", label: "양식" },
  { value: "dessert", label: "디저트" },
  { value: "snack", label: "분식" },
  { value: "salad", label: "샐러드" },
  { value: "drink", label: "음료" },
]

const mockNicknames = ["민지", "요리왕", "쉐프김", "맛집탐방"]

export default function ProfileEditPage() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading: isAuthLoading, updateProfile, updateLocation } = useAuth()

  const [isLoading, setIsLoading] = React.useState(false)
  const [isGettingLocation, setIsGettingLocation] = React.useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [locationDialogOpen, setLocationDialogOpen] = React.useState(false)
  const [pendingLocation, setPendingLocation] = React.useState("")
  const [pendingCoordinates, setPendingCoordinates] = React.useState<{ latitude: number; longitude: number } | null>(null)
  const [nicknameError, setNicknameError] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [profileImagePreview, setProfileImagePreview] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    name: user?.name || "",
    nickname: user?.nickname || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    categories: [] as string[],
  })

  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  React.useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name,
        nickname: user.nickname || "",
        email: user.email,
        bio: user.bio || "",
        location: user.location || "",
      }))
      if (user.profileImage) {
        setProfileImagePreview(user.profileImage)
      }
    }
  }, [user])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Nickname validation removed (no backend support)

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, nickname: value })
    // Nickname validation removed
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // 📍 디버깅: 받은 좌표 출력
          // console.log("🌍 GPS 좌표 획득:")
          // console.log(`   Latitude:  ${latitude}`)
          // console.log(`   Longitude: ${longitude}`)

          // 백엔드 API 호출하여 위치 인증
          const locationAddress = await updateLocation(latitude, longitude)

          // 📍 디버깅: 반환된 주소 출력
          // console.log(`✅ 위치 인증 완료: ${locationAddress}`)

          // 응답 받은 주소와 좌표를 저장 (확인 버튼에서 사용)
          setPendingLocation(locationAddress)
          setPendingCoordinates({ latitude, longitude })
          setLocationDialogOpen(true)
        } catch (error) {
          console.error("위치 인증 오류:", error)
          const errorMessage = error instanceof Error ? error.message : "위치를 가져올 수 없습니다"
          alert(`위치 인증 실패: ${errorMessage}`)
          setIsGettingLocation(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        alert("위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.")
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleConfirmLocation = async () => {
    if (!pendingCoordinates) {
      alert("위치 정보가 없습니다.")
      return
    }

    try {
      setIsGettingLocation(true)

      // 📍 백엔드에 위치 저장
      // console.log("💾 백엔드에 위치 저장 중...")
      // console.log(`   주소: ${pendingLocation}`)
      // console.log(`   좌표: (${pendingCoordinates.latitude}, ${pendingCoordinates.longitude})`)

      // 폼 데이터 업데이트
      setFormData((prev) => ({ ...prev, location: pendingLocation }))

      // 다이얼로그 닫기
      setLocationDialogOpen(false)
      setPendingLocation("")
      setPendingCoordinates(null)

      // ✅ 저장 완료
      console.log("✅ 위치 저장 완료")
    } catch (error) {
      console.error("위치 저장 오류:", error)
      alert("위치 저장에 실패했습니다.")
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleSaveProfile = async () => {
    if (nicknameError) {
      alert("닉네임을 확인해주세요.")
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateProfile({
      // name(실명)은 변경 불가: payload에서 제외
      nickname: formData.nickname,
      bio: formData.bio,
      location: formData.location,
      profileImage: profileImagePreview || undefined,
    })

    setIsLoading(false)
    router.push("/mypage")
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.")
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setIsLoading(false)
    alert("비밀번호가 변경되었습니다.")
  }

  const passwordRequirements = [
    { label: "8자 이상", met: passwordData.newPassword.length >= 8 },
    { label: "영문 포함", met: /[a-zA-Z]/.test(passwordData.newPassword) },
    { label: "숫자 포함", met: /\d/.test(passwordData.newPassword) },
  ]

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link href="/mypage">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              마이페이지로 돌아가기
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">프로필 수정</h1>

        <div className="space-y-6">
          {/* Profile Image */}
          <Card>
            <CardHeader>
              <CardTitle>프로필 사진</CardTitle>
              <CardDescription>프로필에 표시될 사진을 설정하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImagePreview || user?.profileImage || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">
                      {user?.nickname?.charAt(0) || user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    사진 변경
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG 파일, 최대 5MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>이름, 닉네임, 이메일 정보를 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 (실명)</Label>
                  <Input id="name" value={formData.name} disabled readOnly className="bg-muted cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">이름(실명)은 변경할 수 없습니다</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">닉네임 (표시 이름)</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={handleNicknameChange}
                    placeholder="닉네임을 입력하세요"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" type="email" value={formData.email} disabled className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
              </div>


              {/* 자기소개 삭제됨 */}


              {/* Preferred Categories moved here (bottom of Basic Info) */}
              <div className="space-y-2">
                <Label>선호 카테고리 (복수 선택 가능)</Label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((cat) => (
                    <div key={cat.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.value}`}
                        checked={formData.categories.includes(cat.value)}
                        onCheckedChange={() => handleCategoryToggle(cat.value)}
                      />
                      <label
                        htmlFor={`cat-${cat.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {cat.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#800020]" />
                내 위치
              </CardTitle>
              <CardDescription>재료 나눔을 위한 위치 정보를 등록하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={isGettingLocation ? "" : formData.location}
                  readOnly
                  disabled={!formData.location}
                  placeholder={isGettingLocation ? "위치 탐색 중입니다..." : "현재 위치 버튼을 눌러 위치를 인증해주세요"}
                  className={`flex-1 ${!formData.location ? "bg-muted cursor-not-allowed" : ""}`}
                />
                <Button
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="gap-2 bg-transparent"
                >
                  {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  현재 위치
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                위치 정보는 주변 재료 나눔 게시글을 찾는 데 사용됩니다.
                {isGettingLocation && " GPS로 위치를 탐색 중입니다..."}
              </p>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>비밀번호 변경</CardTitle>
              <CardDescription>계정 보안을 위해 정기적으로 비밀번호를 변경하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="새 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {passwordData.newPassword && (
                  <div className="flex gap-3 mt-2">
                    {passwordRequirements.map((req) => (
                      <div
                        key={req.label}
                        className={`flex items-center gap-1 text-xs ${req.met ? "text-[#800020]" : "text-muted-foreground"}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? "bg-[#800020]/20" : "bg-muted"
                            }`}
                        >
                          {req.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
                )}
              </div>

              <Button
                onClick={handleChangePassword}
                variant="outline"
                disabled={
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
              >
                비밀번호 변경
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => router.push("/mypage")}>
              취소
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading || !!nicknameError}
              className="bg-[#800020] hover:bg-[#800020]/90"
            >
              {isLoading ? "저장 중..." : "변경사항 저장"}
            </Button>
          </div>
        </div>
      </main>

      {/* 위치 확인 다이얼로그 */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>위치 확인</DialogTitle>
            <DialogDescription>현재 위치가 맞는지 확인해주세요.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <MapPin className="h-5 w-5 text-[#800020]" />
              <span className="font-medium">{pendingLocation}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmLocation} className="bg-[#800020] hover:bg-[#800020]/90">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}