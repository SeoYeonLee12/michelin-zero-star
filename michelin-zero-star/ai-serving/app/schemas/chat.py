# app/schemas/chat.py

from pydantic import BaseModel, Field
from typing import List, Optional

# 1. [Request] 프론트 -> AI (질문)
class ChatRequest(BaseModel):
    user_id: int = Field(..., description="사용자 ID")
    query: str = Field(..., description="사용자 질문 (예: 매운거 추천해줘)")
    # 필터링을 위한 사용자 정보:  선호 카테고리 (없다면 빈 딕셔너리)
    user_context: Optional[dict] = Field(default={}, description="선호 카테고리")

# 2. [Data] UI 카드 구성을 위한 레시피 정보 (DTO)
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
    
# 3. [Response] AI -> 프론트 (최종 응답)
class ChatResponse(BaseModel):
    answer: str = Field(..., description="AI 셰프의 답변")
    recommended_recipes: List[RecipeInfo] = Field(..., description="추천 레시피 카드 리스트")