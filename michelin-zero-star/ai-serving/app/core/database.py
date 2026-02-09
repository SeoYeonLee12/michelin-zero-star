from elasticsearch import AsyncElasticsearch, ConnectionError
from app.core.config import settings
import asyncio # 시간 지연을 위해 필요

class ElasticClient:
    """
    ES와의 연결 관리하는 전용 클라이언트 클래스
    - 연결 생성
    - 연결 상태 확인
    - 연결 종료
    """
    def __init__(self):
        self.client: AsyncElasticsearch = None # 연결 전 None 초기화

    def connect(self):
        """
        Elasticsearch 클라이언트 연결 생성
        - 네트워크 연결 설정
        - 비동기(Async)방식으로 ES와 통신 가능하게 
        """
        self.client = AsyncElasticsearch(
            settings.ES_URL, # 서버 주소 받아오기
            # 타임아웃 설정 (네트워크 지연 대비)
            request_timeout=30,
            max_retries=3,
            retry_on_timeout=True # 타임 아웃시 재시도 허용
        )
        print(f"Elasticsearch Configured: {settings.ES_URL}")

    async def check_connection(self):
        if not self.client:
            print("⚠️ Elasticsearch client is not initialized.")
            return

        print("⏳ Waiting for Elasticsearch to be ready...")
        
        # 5초 간격으로 최대 10번(50초) 시도
        for i in range(10):
            try:
                # 1. Ping 테스트
                if await self.client.ping():
                    print("✅ Elasticsearch Ping Success!")
                    
                    # 2. 인덱스 확인
                    index_name = "michelin_recipes"
                    if await self.client.indices.exists(index=index_name):
                        print(f"✅ Index '{index_name}' found.")
                    else:
                        print(f"ℹ️ Index '{index_name}' not found yet. (Wait for data team)")
                    return # 성공하면 함수 종료
                
            except Exception as e:
                # 아직 ES가 안 켜졌으면 에러가 남 -> 무시하고 대기
                pass
            
            print(f"🔄 ES Connecting... ({i+1}/10)")
            await asyncio.sleep(5) # 5초 대기
            
        print("❌ Elasticsearch Connection Failed after 50s.")

    async def close(self):
        """
        연결 종료 (리소스 해제)
        - 애플리케이션 종료 시 호출
        - 커넥션 정리 및 리소스 해제
        """
        if self.client:
            await self.client.close()
            print("Elasticsearch 연결 끊김")

# 전역 인스턴스 생성
es_client = ElasticClient()