"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Upload, ChevronLeft, ChevronRight, X, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { getCookie } from "@/lib/cookie"
import { registerRecipe, updateRecipe, getRecipeDetail, type RegisterRecipeRequest } from "@/lib/api/recipes"
import { StarRewardBadge } from "@/components/cook-sync/star-reward-badge"
import { AnimatePresence, motion } from "framer-motion"

interface RecipeStep {
  id: number
  action: string
  description: string
  duration: number
  image: File | null
  imagePreview: string | null
  tips: string
  errors?: {
    description?: boolean
    duration?: boolean
    image?: boolean
  }
}

interface Ingredient {
  id: number
  name: string
  amount: string
}

const categoryOptions = [
  { value: "밥", label: "밥" },
  { value: "반찬", label: "반찬" },
  { value: "국물", label: "국물" },
  { value: "면", label: "면" },
  { value: "디저트", label: "디저트" },
  { value: "분식", label: "분식" },
  { value: "샐러드", label: "샐러드" },
  { value: "음료", label: "음료" },
  { value: "야식&술안주", label: "야식&술안주" },
  { value: "기타", label: "기타" },
]

const CATEGORY_MAP: Record<string, number> = {
  "밥": 1, "반찬": 2, "국물": 3, "면": 4, "디저트": 5,
  "분식": 6, "샐러드": 7, "음료": 8, "기타": 9, "야식&술안주": 10
}

// Wrap in Suspense for useSearchParams
export default function NewRecipePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewRecipeForm />
    </Suspense>
  )
}

function NewRecipeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recipeIdParam = searchParams.get("id")
  const isEditMode = !!recipeIdParam
  const { isLoggedIn, addUserRecipe, isLoading, earnStars } = useAuth() // ✅ Added isLoading
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [servings, setServings] = useState("")
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [ingredientName, setIngredientName] = useState("")
  const [ingredientAmount, setIngredientAmount] = useState("")
  const [steps, setSteps] = useState<RecipeStep[]>([
    { id: 1, action: "", description: "", duration: 0, image: null, imagePreview: null, tips: "" },
  ])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [showRewardDialog, setShowRewardDialog] = useState(false)

  // ✅ Validation States
  const [ingredientError, setIngredientError] = useState(false)
  const [tagError, setTagError] = useState(false)
  const [titleError, setTitleError] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [createdRecipeId, setCreatedRecipeId] = useState<number | null>(null)

  // ✅ Fetch data if Edit Mode
  useEffect(() => {
    if (isEditMode && recipeIdParam) {
      const fetchRecipe = async () => {
        try {
          const data = await getRecipeDetail(recipeIdParam)
          if (data) {
            setTitle(data.title)
            setDescription(data.description)
            setServings(String(data.servings))

            // Thumbnail
            setThumbnailPreview(data.mainImageUrl)
            // Note: thumbnail file stays null unless user changes it

            // Category (Find key by value or manual mapping needed if backend returns names.
            // Backend returns `categoryNames`. Assuming single category for now or picking first)
            if (data.categoryNames && data.categoryNames.length > 0) {
              // categoryOptions values are like "밥", "반찬", etc.
              // data.categoryNames might be ["국물"] ?
              // Let's try to match directly.
              setCategory(data.categoryNames[0])
            }

            // Tags
            if (data.tags) {
              setTags(data.tags.map(t => t.tag_name))
            }

            // Ingredients
            if (data.ingredients) {
              setIngredients(data.ingredients.map((ing, idx) => ({
                id: Date.now() + idx,
                name: ing.ingredient_name,
                amount: ing.ingredient_amount
              })))
            }

            // Steps
            if (data.steps && data.steps.length > 0) {
              setSteps(data.steps.map(s => ({
                id: s.step_number,
                action: "조리 순서",
                description: s.step_description,
                duration: s.timer_seconds,
                image: null,
                imagePreview: s.step_imageUrl,
                tips: s.cooking_tip || ""
              })).sort((a, b) => a.id - b.id))
              setCurrentStepIndex(0)
            }
          }
        } catch (e) {
          console.error("Failed to fetch recipe for edit", e)
          alert("레시피 정보를 불러오는데 실패했습니다.")
        }
      }
      fetchRecipe()
    }
  }, [isEditMode, recipeIdParam])

  // ✅ Wait for loading
  if (isLoading) return null

  if (!isLoggedIn) {
    router.push("/login")
    return null
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnail(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const removeThumbnail = () => {
    setThumbnail(null)
    setThumbnailPreview(null)
  }

  const handleStepImageChange = (stepId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSteps(
        steps.map((step) =>
          step.id === stepId ? { ...step, image: file, imagePreview: URL.createObjectURL(file) } : step,
        ),
      )
    }
  }

  const removeStepImage = (stepId: number) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, image: null, imagePreview: null } : step)))
  }

  const addStep = () => {
    const newId = Math.max(...steps.map((s) => s.id)) + 1
    const newStep = {
      id: newId,
      action: "",
      description: "",
      duration: 0,
      image: null,
      imagePreview: null,
      tips: "",
    }
    setSteps([...steps, newStep])
    setCurrentStepIndex(steps.length)
  }

  const removeStep = (stepId: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((s) => s.id !== stepId)
      setSteps(newSteps)
      if (currentStepIndex >= newSteps.length) {
        setCurrentStepIndex(newSteps.length - 1)
      }
    }
  }

  const updateStep = (stepId: number, field: keyof RecipeStep, value: string | number | File | null) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, [field]: value } : step)))
  }

  const addTag = () => {
    if (tags.length >= 10) {
      alert("태그는 최대 10개까지 등록할 수 있습니다.")
      return
    }
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      if (tagInput.trim().length > 20) {
        alert("태그는 20자 이내로 입력해주세요.")
        return
      }
      setTags([...tags, tagInput.trim()])
      setTagInput("")
      setTagError(false) // 태그 추가 시 에러 해제
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const addIngredient = () => {
    if (!ingredientName.trim()) return

    // 이름만 있고 용량이 없으면 에러
    if (ingredientName.trim() && !ingredientAmount.trim()) {
      setIngredientError(true)
      return
    }

    setIngredientError(false)

    if (ingredientName.trim() && ingredientAmount.trim()) {
      const newIngredient: Ingredient = {
        id: Date.now(),
        name: ingredientName.trim(),
        amount: ingredientAmount.trim(),
      }
      setIngredients([...ingredients, newIngredient])
      setIngredientName("")
      setIngredientAmount("")
    }
  }

  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter((i) => i.id !== id))
  }

  const totalCookingTime = steps.reduce((acc, step) => acc + step.duration, 0)

  const formatCookingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) {
      return `${remainingSeconds}초`
    } else if (remainingSeconds === 0) {
      return `${minutes}분`
    } else {
      return `${minutes}분 ${remainingSeconds}초`
    }
  }

  const handleSubmitClick = () => {
    let isValid = true

    if (ingredients.length === 0) {
      setIngredientError(true)
      isValid = false
    }

    if (tags.length === 0) {
      setTagError(true)
      isValid = false
    }

    if (!title) {
      setTitleError(true)
      isValid = false
    } else {
      setTitleError(false)
    }

    if (!thumbnailPreview) {
      setThumbnailError(true)
      isValid = false
    } else {
      setThumbnailError(false)
    }

    const newSteps = steps.map((step) => {
      const errors = {
        description: !step.description,
        duration: !step.duration,
        image: !step.imagePreview && !step.image,
      }
      if (errors.description || errors.duration || errors.image) {
        isValid = false
      }
      return { ...step, errors }
    })
    setSteps(newSteps)

    if (!isValid) {
      return
    }

    setConfirmDialogOpen(true)
  }



  // ... existing code ...

  const handleConfirmSubmit = async () => {
    setConfirmDialogOpen(false)

    try {
      // 1. 데이터 매핑
      const requestData: RegisterRecipeRequest = {
        title,
        mainImageUrl: thumbnailPreview || "", // Use existing preview URL if no new file
        recipeDescription: description,
        cookTime: totalCookingTime,
        servings: Number(servings) || 1,
        // 영양소 정보는 입력 UI가 없으므로 기본값 0 처리
        calorie: 0,
        carbohydrate: 0,
        protein: 0,
        saturatedFat: 0,
        cholesterol: 0,
        sodium: 0,
        calcium: 0,
        // Using existing Category logic
        categoryIds: [CATEGORY_MAP[category] || 10],
        ingredients: ingredients.map(i => ({
          ingredientName: i.name,
          ingredientAmount: i.amount
        })),
        tags: tags.map(t => ({ tagName: t })),
        steps: steps.map(s => ({
          stepNumber: s.id,
          stepDescription: s.description,
          timerSeconds: s.duration,
          stepImageUrl: s.imagePreview || "", // Use existing preview URL if no new file
          cookingTip: s.tips || null
        }))
      }

      // 2. 파일 객체 수집
      const files: any = {
        mainImage: thumbnail,
        stepImages: steps.reduce((acc, step) => {
          if (step.image) {
            acc[step.id] = step.image
          }
          return acc
        }, {} as { [key: number]: File })
      }

      // 3. API 호출 (Update or Register)
      let response;
      if (isEditMode && recipeIdParam) {
        // For Update
        response = await updateRecipe(recipeIdParam, requestData, files)
        // updateRecipe returns RegisterRecipeResponse according to recipes.ts types? 
        // Let's check recipes.ts. Yes: Promise<RegisterRecipeResponse>
        // But usually update might not return ID? 
        // recipes.ts line 256: return apiFetch<RegisterRecipeResponse>(...)
        alert("레시피가 수정되었습니다.")
        router.push(`/recipes/${recipeIdParam}`)
        return
      } else {
        // For Register
        response = await registerRecipe(requestData, files)
      }

      if (response && response.recipeId) {
        setCreatedRecipeId(response.recipeId)
      }

      // 3. 성공 처리 (Only for Create)
      earnStars(1.0, "recipe")
      // setSuccessDialogOpen(true) // 기존 Dialog 대신 보상 Dialog 사용
      setShowRewardDialog(true)

    } catch (error) {
      console.error("Recipe registration/update failed:", error)
      alert("레시피 저장에 실패했습니다.")
    }
  }

  const handleViewRecipe = () => {
    setSuccessDialogOpen(false)
    if (createdRecipeId) {
      router.push(`/recipes/${createdRecipeId}`)
    } else {
      router.push("/recipes?type=user") // Fallback
    }
  }

  const handleCancel = () => {
    if (title || description || thumbnailPreview || steps.some((s) => s.action || s.description)) {
      setExitDialogOpen(true)
    } else {
      router.back()
    }
  }

  const handleExitConfirm = () => {
    setExitDialogOpen(false)
    router.push("/")
  }

  const currentStep = steps[currentStepIndex]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditMode ? "레시피 수정" : "레시피 등록"}</h1>
            <p className="text-muted-foreground">나만의 레시피를 공유해보세요</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="space-y-2 md:w-1/2">
                  <Label>대표 이미지<span className="text-red-500 ml-1">*</span></Label>
                  <div className="relative">
                    <div
                      className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors aspect-[4/3] flex items-center justify-center"
                      onClick={() => document.getElementById("thumbnail-input")?.click()}
                    >
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview || "/placeholder.svg"}
                          alt="Thumbnail"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">클릭하여 대표 이미지를 업로드하세요</p>
                        </div>
                      )}
                    </div>
                    {thumbnailPreview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeThumbnail()
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    id="thumbnail-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleThumbnailChange(e)
                      if (e.target.files?.length) setThumbnailError(false)
                    }}
                  />
                  {thumbnailError && <p className="text-red-500 text-sm mt-1">대표 이미지를 등록해주세요</p>}
                </div>

                <div className="space-y-4 md:w-1/2">
                  <div className="space-y-2">
                    <Label htmlFor="title">레시피 제목<span className="text-red-500 ml-1">*</span></Label>
                    <Input
                      id="title"
                      placeholder="예: 엄마표 김치찌개 (최대 50자)"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value)
                        if (e.target.value) setTitleError(false)
                      }}
                      maxLength={50}
                      className={cn(titleError && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {titleError && <p className="text-red-500 text-sm mt-1">레시피 제목을 입력해주세요</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">레시피 소개</Label>
                    <Textarea
                      id="description"
                      placeholder="이 레시피에 대해 간단히 소개해주세요 (최대 1000자)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[80px]"
                      maxLength={1000}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">카테고리<span className="text-red-500 ml-1">*</span></Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="servings">인분<span className="text-red-500 ml-1">*</span></Label>
                      <Input
                        id="servings"
                        placeholder="예: 2"
                        type="number"
                        value={servings}
                        onChange={(e) => setServings(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2" id="tag-section">
                <Label>
                  태그<span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="태그 입력 후 추가 (최대 10개, 20자 이내)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    maxLength={20}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    추가
                  </Button>
                </div>
                {tagError && tags.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">태그를 입력해주세요</p>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#800020]/10 text-[#800020] text-sm"
                      >
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  재료<span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="재료명 (예: 김치)"
                    value={ingredientName}
                    onChange={(e) => setIngredientName(e.target.value)}
                    className="flex-[6]"
                    maxLength={20}
                  />
                  <Input
                    placeholder="용량 (예: 200g, 약간, 1큰술, 1.5컵)"
                    value={ingredientAmount}
                    onChange={(e) => {
                      setIngredientAmount(e.target.value)
                      if (e.target.value.trim()) setIngredientError(false)
                    }}
                    className={cn("flex-[4]", ingredientError && "border-red-500 focus-visible:ring-red-500")}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                    maxLength={20}
                  />
                  <Button type="button" onClick={addIngredient} variant="outline">
                    추가
                  </Button>
                </div>
                {ingredientError && (
                  <p className="text-red-500 text-sm mt-1">용량을 입력해주세요</p>
                )}
                {ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ingredients.map((ingredient) => (
                      <span
                        key={ingredient.id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-sm"
                      >
                        {ingredient.name} {ingredient.amount && `(${ingredient.amount})`}
                        <button onClick={() => removeIngredient(ingredient.id)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  총 조리시간:{" "}
                  <span className="font-semibold text-foreground">{formatCookingTime(totalCookingTime)}</span> (
                  {steps.length}단계)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Steps - Carousel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">조리 단계</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {currentStepIndex + 1} / {steps.length}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Carousel Navigation */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentStepIndex === 0}
                  className="shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 p-5 border rounded-xl overflow-hidden min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg text-[#800020]">STEP {currentStepIndex + 1}</h4>
                    {steps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(currentStep.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="space-y-2 md:w-1/2">
                      <Label className="text-base">단계 이미지<span className="text-red-500 ml-1">*</span></Label>
                      <div className="relative">
                        <div
                          className="border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors aspect-[4/3] flex items-center justify-center"
                          onClick={() => document.getElementById(`step-image-${currentStep.id}`)?.click()}
                        >
                          {currentStep.imagePreview ? (
                            <img
                              src={currentStep.imagePreview || "/placeholder.svg"}
                              alt={`Step ${currentStepIndex + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div>
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">클릭하여 이미지 업로드 (필수)</p>
                            </div>
                          )}
                        </div>
                        {currentStep.imagePreview && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeStepImage(currentStep.id)
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <input
                        id={`step-image-${currentStep.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleStepImageChange(currentStep.id, e)}
                      />
                      {currentStep.errors?.image && <p className="text-red-500 text-sm mt-1">단계 이미지를 등록해주세요</p>}
                    </div>

                    <div className="space-y-4 md:w-1/2 flex flex-col min-w-0">
                      <div className="space-y-2">
                        <Label className="text-base">소요 시간 (분/초)<span className="text-red-500 ml-1">*</span></Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={Math.floor((currentStep.duration || 0) / 60) || ""}
                              onChange={(e) => {
                                const valStr = e.target.value.replace(/^0+/, "")
                                const newMinutes = valStr ? parseInt(valStr) : 0
                                const currentSeconds = (currentStep.duration || 0) % 60
                                updateStep(currentStep.id, "duration", newMinutes * 60 + currentSeconds)
                              }}
                              placeholder="0"
                              className="text-base"
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">분</span>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={(currentStep.duration || 0) % 60 || ""}
                              onChange={(e) => {
                                let valStr = e.target.value.replace(/^0+/, "")
                                // Handle case where user might paste/type > 59, logic should clamp or just accept?
                                // For simplicity allow typing, clamping via max usually handles spin buttons but typing can be anything.
                                // Ensuring valid seconds:
                                let newSeconds = valStr ? parseInt(valStr) : 0
                                // Optional: clamp seconds logic if desired, but user asked for input fix.

                                const currentMinutes = Math.floor((currentStep.duration || 0) / 60)
                                updateStep(currentStep.id, "duration", currentMinutes * 60 + newSeconds)
                              }}
                              placeholder="0"
                              className="text-base"
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">초</span>
                          </div>
                        </div>
                      </div>
                      {currentStep.errors?.duration && <p className="text-red-500 text-sm mt-1">소요 시간을 입력해주세요</p>}

                      <div className="space-y-2 flex-1 flex flex-col min-w-0">
                        <Label className="text-base">상세 설명<span className="text-red-500 ml-1">*</span></Label>
                        <Textarea
                          placeholder="이 단계에서 해야 할 일을 자세히 설명해주세요 (최대 700자)"
                          value={currentStep.description}
                          onChange={(e) => updateStep(currentStep.id, "description", e.target.value)}
                          className="min-h-[100px] flex-1 overflow-y-auto text-base resize-none break-all whitespace-pre-wrap"
                          maxLength={700}
                        />
                        {currentStep.errors?.description && <p className="text-red-500 text-sm mt-1">상세 설명을 입력해주세요</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base">팁 (선택)</Label>
                        <Input
                          placeholder="요리 팁을 입력하세요 (최대 300자)"
                          value={currentStep.tips}
                          onChange={(e) => updateStep(currentStep.id, "tips", e.target.value)}
                          className="text-base"
                          maxLength={300}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (currentStepIndex === steps.length - 1) {
                      addStep()
                    } else {
                      setCurrentStepIndex((prev) => prev + 1)
                    }
                  }}
                  className="shrink-0"
                >
                  {currentStepIndex === steps.length - 1 ? <Plus className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStepIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentStepIndex
                        ? "bg-[#800020] w-6"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit - Cancel | Register buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleCancel} className="bg-transparent">
              취소
            </Button>
            <Button onClick={handleSubmitClick} className="bg-[#800020] hover:bg-[#800020]/90">
              등록
            </Button>
          </div>
        </div >
      </main >

      {/* Confirm Submit Dialog */}
      < AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEditMode ? "레시피 수정" : "레시피 등록"}</AlertDialogTitle>
            <AlertDialogDescription>{isEditMode ? "레시피를 수정하시겠습니까?" : "레시피를 등록하시겠습니까?"}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니오</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-[#800020] hover:bg-[#800020]/90">
              예
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              작성 중인 내용이 있습니다. 페이지를 떠나면 작성 중인 내용이 사라집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 작성</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitConfirm} className="bg-[#800020] hover:bg-[#800020]/90">
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-[#800020]/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#800020]" />
              </div>
            </div>
            <DialogTitle className="text-center">레시피가 등록되었습니다!</DialogTitle>
            <DialogDescription className="text-center">
              나만의 레시피가 성공적으로 등록되었어요. 다른 사용자들과 공유해보세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setSuccessDialogOpen(false)}>
              계속 등록하기
            </Button>
            <Button className="flex-1 bg-[#800020] hover:bg-[#800020]/90" onClick={handleViewRecipe}>
              내 레시피 보기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward Dialog */}
      <AnimatePresence>
        {showRewardDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleViewRecipe}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[340px] bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-center overflow-hidden border border-gray-50"
            >
              <div className="relative space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">레시피 등록 성공!</h2>
                  <p className="text-gray-400 text-sm font-medium">나만의 레시피가 등록되었습니다.</p>
                </div>

                <div className="py-2">
                  <StarRewardBadge
                    amount={1}
                    customText="1 스타 적립"
                    starSize="md"
                    textSize="sm"
                  />
                </div>

                <div className="flex gap-3 mt-1">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setShowRewardDialog(false)}
                  >
                    계속 등록하기
                  </Button>
                  <Button
                    className="flex-1 bg-[#800020] hover:bg-[#800020]/90"
                    onClick={handleViewRecipe}
                  >
                    내 레시피 보기
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
