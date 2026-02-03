from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["chat"])

class ChatReq(BaseModel):
    text: str

@router.post("/chat")
def chat(req: ChatReq):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is empty")

    # TODO: 팀원이 LLM 붙이면 여기만 교체
    return {"answer": f"(임시응답) '{text}' 라고 말했어요. LLM 연결되면 진짜 답변으로 바뀝니다."}
