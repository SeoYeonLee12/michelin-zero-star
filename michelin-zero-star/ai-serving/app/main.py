from contextlib import asynccontextmanager # 서버 종료/시작시점 관리를 FastAPI가 제공하는 방식 대신 Fast API의 lifespan에 연결
'''
FastAPI 서버 시작
 └─ lifespan 시작 코드 실행
     ├─ Elasticsearch 연결
     ├─ 연결 상태 체크
     └─ 서버 정상 기동

FastAPI 서버 종료
 └─ lifespan 종료 코드 실행
     ├─ Elasticsearch 연결 종료
     └─ 리소스 정리
'''
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import es_client
from app.api import rag_router
from app.api.speech_router import router as speech_router
from app.api.chat_router import router as chat_router
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # [시작] 서버 뜰 때 실행
    print("Server Starting...")
    es_client.connect()
    await es_client.check_connection() # 연결 테스트 수행
    # --- 이단계까지는 아직 요청 안 받음 & 서버 인프라 준비 단계 --- #
    yield # 실제로 요청을 받기 시작
    # [종료] 서버 꺼질 때 실행
    print("Server Shutting down...")
    await es_client.close()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan) # Fast API 애플리케이션 생성

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI Server is running"}

# 라우터 등록
# URL Prefix: /api/chat -> 최종 주소: /api/chat/search
app.include_router(rag_router.router, prefix="/api/chat", tags=["Chatbot"])
app.include_router(speech_router)
app.include_router(chat_router)