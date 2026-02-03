# app/schemas/chat.py
from pydantic import BaseModel, Field
from typing import List, Optional

# --- [공통 DTO] UI 카드 구성을 위한 레시피 정보 (DTO) ---
# ES에서 조회한 데이터를 채워서 프론트로 전송
class RecipeInfo(BaseModel):
    recipes_id: int = Field(..., description="레시피 ID (상세페이지 이동용)")
    title: str = Field(..., description="요리명")
    main_image_url: str = Field(..., description="사진 URL")
    
    # 카드 UI에 표시할 핵심 정보들
    cook_time: int = Field(..., description="조리시간 (분)")
    servings: int = Field(..., description="인분수 (몇 인분)") 
    calories: float = Field(..., description="칼로리 (kcal)")
    tags: List[str] = Field(default=[], description="태그 리스트 (#매운맛 등)")

# --- [RAG AI 추천용] ---
class RagRequest(BaseModel):
    user_id: int = Field(..., description="사용자 ID")
    query: str = Field(..., description="사용자 질문")
    # 사용자 선호 카테고리 리스트
    user_favorite_categories: List[str] = Field(default=[], description="선호 카테고리 목록")

# --- [레시피 Q&A용] ---
class StepDetail(BaseModel):
    step_number: int
    description: str

class ChatMessage(BaseModel):
    sender_type: str = Field(..., description="user 또는 assistant")
    content: str

class QnaRequest(BaseModel):
    user_id: int
    query: str
    recipe_all_steps: List[StepDetail] = Field(..., description="단계별 레시피 정보")
    current_step: int = Field(..., description="현재 사용자가 머물고 있는 단계")
    chat_history: List[ChatMessage] = Field(default=[], description="과거 대화 내역")

# --- [공통 응답: Response] ---
class ChatResponse(BaseModel):
    answer: str = Field(..., description="AI 셰프의 답변")
    recommended_recipes: List[RecipeInfo] = Field(..., description="추천 레시피 카드 리스트")

# --- [수정] Q&A 전용 응답 모델 추가 (레시피 리스트 제거) ---
class QnaResponse(BaseModel):
    answer: str = Field(..., description="AI 셰프의 답변 (레시피 추천 없음)")