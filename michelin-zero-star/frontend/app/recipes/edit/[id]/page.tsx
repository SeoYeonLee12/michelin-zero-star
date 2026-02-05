"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/cook-sync/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Upload, ChevronLeft, ChevronRight, X, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

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

const categoryOptions = [
  { value: "korean", label: "한식" },
  { value: "chinese", label: "중식" },
  { value: "japanese", label: "일식" },
  { value: "western", label: "양식" },
  { value: "dessert", label: "디저트" },
  { value: "snack", label: "분식" },
  { value: "salad", label: "샐러드" },
  { value: "drink", label: "음료" },
  { value: "nightsnack", label: "야식&술안주" },
  { value: "etc", label: "기타" },
]

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string
  const { isLoggedIn, userRecipes, updateUserRecipe } = useAuth()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [servings, setServings] = useState("")
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  // ✅ Ingredient Interface match
  const [ingredients, setIngredients] = useState<{ name: string, amount: string }[]>([])
  const [ingredientName, setIngredientName] = useState("")
  const [ingredientAmount, setIngredientAmount] = useState("")

  // ✅ Validation States
  const [ingredientError, setIngredientError] = useState(false)
  const [tagError, setTagError] = useState(false)
  const [titleError, setTitleError] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [steps, setSteps] = useState<RecipeStep[]>([
    { id: 1, action: "", description: "", duration: 0, image: null, imagePreview: null, tips: "" },
  ])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    const recipe = userRecipes.find((r) => r.id === recipeId)
    if (recipe) {
      setTitle(recipe.title)
      setDescription(recipe.description)
      setCategory(recipe.category)
      setServings(String(recipe.servings))
      setThumbnailPreview(recipe.thumbnail)
      setThumbnailPreview(recipe.thumbnail)
      setTags(recipe.tags)

      // ✅ Handle legacy data (string[]) or {name, amount}[]
      if (recipe.ingredients) {
        setIngredients(recipe.ingredients.map((i: any) => {
          if (typeof i === 'string') return { name: i, amount: "" }
          return { name: i.name, amount: i.amount }
        }))
      } else {
        // Fallback legacy (steps[0].ingredients)
        const stepIngs = (recipe.steps[0] as any)?.ingredients || []
        setIngredients(stepIngs.map((i: any) => {
          if (typeof i === 'string') return { name: i, amount: "" }
          return { name: i.name, amount: i.amount }
        }))
      }
      setSteps(
        recipe.steps.map((step) => ({
          id: step.id,
          action: step.action,
          description: step.description,
          duration: step.duration,
          image: null,
          imagePreview: step.imagePreview,
          tips: step.tips,
        })),
      )
    } else {
      router.push("/mypage")
    }
  }, [isLoggedIn, recipeId, userRecipes, router])

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file))
    }
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
      setTagError(false)
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const addIngredient = () => {
    if (!ingredientName.trim()) return

    if (ingredientName.trim() && !ingredientAmount.trim()) {
      setIngredientError(true)
      return
    }
    setIngredientError(false)

    if (ingredientName.trim() && ingredientAmount.trim()) {
      setIngredients([...ingredients, { name: ingredientName.trim(), amount: ingredientAmount.trim() }])
      setIngredientName("")
      setIngredientAmount("")
    }
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const totalCookingTime = steps.reduce((acc, step) => acc + step.duration, 0)

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

  const handleConfirmSubmit = () => {
    setConfirmDialogOpen(false)
    updateUserRecipe(recipeId, {
      title,
      description,
      category,
      servings: Number(servings) || 1,
      thumbnail: thumbnailPreview!,
      tags,
      steps: steps.map((step) => ({
        id: step.id,
        action: step.action,
        description: step.description,
        duration: step.duration,
        imagePreview: step.imagePreview,
        tips: step.tips,
      })),
      ingredients: ingredients, // Pass objects
    })
    router.push("/mypage")
  }

  const currentStep = steps[currentStepIndex]

  if (!isLoggedIn) return null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">레시피 수정</h1>
            <p className="text-muted-foreground">레시피 정보를 수정하세요</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>대표 이미지<span className="text-red-500 ml-1">*</span></Label>
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors min-h-[240px] flex items-center justify-center"
                  onClick={() => document.getElementById("thumbnail-input")?.click()}
                >
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview || "/placeholder.svg"}
                      alt="Thumbnail"
                      className="w-full h-56 object-cover rounded-lg"
                    />
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">클릭하여 대표 이미지를 업로드하세요</p>
                    </div>
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

              {/* Tags */}
              <div className="space-y-2">
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

              {/* Ingredients */}
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

                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                    className={cn("flex-[4]", ingredientError && "border-red-500 focus-visible:ring-red-500")}
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
                    {ingredients.map((ingredient, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-sm"
                      >
                        {ingredient.name} {ingredient.amount && `(${ingredient.amount})`}
                        <button onClick={() => removeIngredient(idx)} className="hover:text-red-500">
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
                  <span className="font-semibold text-foreground">{Math.ceil(totalCookingTime / 60)}분</span> (
                  {steps.length}단계)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Steps - Carousel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>조리 단계</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {currentStepIndex + 1} / {steps.length}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1 bg-transparent">
                    <Plus className="h-4 w-4" />
                    단계 추가
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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

                <div className="flex-1 p-4 border rounded-xl space-y-4 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#800020]">STEP {currentStepIndex + 1}</h4>
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

                  <div className="space-y-2">
                    <Label>단계 이미지<span className="text-red-500 ml-1">*</span></Label>
                    <div
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => document.getElementById(`step-image-${currentStep.id}`)?.click()}
                    >
                      {currentStep.imagePreview ? (
                        <img
                          src={currentStep.imagePreview || "/placeholder.svg"}
                          alt={`Step ${currentStepIndex + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">클릭하여 이미지 업로드 (필수)</p>
                        </>
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

                  {/* <div className="space-y-2">
                    <Label>단계 제목<span className="text-red-500 ml-1">*</span></Label>
                    <Input
                      placeholder="예: 재료 손질하기"
                      value={currentStep.action}
                      onChange={(e) => updateStep(currentStep.id, "action", e.target.value)}
                    />
                  </div> */}

                  <div className="space-y-2">
                    <Label>상세 설명<span className="text-red-500 ml-1">*</span></Label>
                    <Textarea
                      placeholder="이 단계에서 해야 할 일을 자세히 설명해주세요 (최대 700자)"
                      value={currentStep.description}
                      onChange={(e) => updateStep(currentStep.id, "description", e.target.value)}
                      className="break-all whitespace-pre-wrap"
                      maxLength={700}
                    />
                    {currentStep.errors?.description && <p className="text-red-500 text-sm mt-1">상세 설명을 입력해주세요</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>소요 시간 (분/초)<span className="text-red-500 ml-1">*</span></Label>
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
                            const valStr = e.target.value.replace(/^0+/, "")
                            const newSeconds = valStr ? parseInt(valStr) : 0
                            const currentMinutes = Math.floor((currentStep.duration || 0) / 60)
                            updateStep(currentStep.id, "duration", currentMinutes * 60 + newSeconds)
                          }}
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">초</span>
                      </div>
                    </div>
                    {currentStep.errors?.duration && <p className="text-red-500 text-sm mt-1">소요 시간을 입력해주세요</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>팁 (선택)</Label>
                    <Input
                      placeholder="요리 팁을 입력하세요 (최대 300자)"
                      value={currentStep.tips}
                      onChange={(e) => updateStep(currentStep.id, "tips", e.target.value)}
                      maxLength={300}
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                disabled={currentStepIndex === steps.length - 1}
                className="shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

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

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()} className="bg-transparent">
            취소
          </Button>
          <Button onClick={handleSubmitClick} className="bg-[#800020] hover:bg-[#800020]/90">
            저장
          </Button>
        </div>
    </div>
      </main >

    <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>레시피 수정</AlertDialogTitle>
          <AlertDialogDescription>변경사항을 저장하시겠습니까?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>아니오</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmSubmit} className="bg-[#800020] hover:bg-[#800020]/90">
            예
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div >
  )
}
