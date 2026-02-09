from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatResponse, RagRequest, QnaRequest, QnaResponse
from app.services.rag_service import rag_service

router = APIRouter()

# 1. [RAG] AI 셰프 추천 (메인 페이지)
@router.post("/search", response_model=ChatResponse)
async def chat_search(request: RagRequest):
    try:
        # 서비스 로직 호출
        answer, recipes = await rag_service.run_rag(
            user_id=request.user_id,
            query=request.query,
            user_favorite_categories=request.user_favorite_categories
        )
        return ChatResponse(answer=answer, recommended_recipes=recipes)
    except Exception as e:
        print(f"RAG Error: {e}")
        # 에러 나도 서버 죽지 않게 처리
        raise HTTPException(status_code=500, detail=str(e))

# 2. [Q&A] 레시피 상세 질의응답 (상세 페이지)
@router.post("/qna", response_model=QnaResponse)
async def chat_qna(request: QnaRequest):
    try:
        # 서비스 로직 호출
        answer, _ = await rag_service.run_qna(
            query=request.query,
            recipe_all_steps=request.recipe_all_steps,
            current_step=request.current_step,
            chat_history=request.chat_history
        )
        # Q&A는 추천 레시피 없이 답변만 반환
        return QnaResponse(answer=answer)
    except Exception as e:
        print(f"QnA Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))