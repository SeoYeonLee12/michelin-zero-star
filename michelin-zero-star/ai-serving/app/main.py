from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME) # 프로젝트 이름 설정 -> Swagger 등에 표시될 수 있도록

# GET 요청 처리 엔드포인트 (서버 상태 확인 용도로 사용)
@app.get("/") 
def health_check():
    # 서버가 정상 실행함을 알리는 응답 반환
    return {"status": "ok", "message": "AI Server is running"}