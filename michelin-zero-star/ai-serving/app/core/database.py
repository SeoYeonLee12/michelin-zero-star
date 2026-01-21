from elasticsearch import AsyncElasticsearch, ConnectionError
from app.core.config import settings

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
        """
        healthcheck용
        연결 상태 확인 및 인덱스 존재 여부 체크 (로그 출력용)
        - 클라이언트 초기화 여부
        - ES 서버 Ping 테스트
        - 특정 인덱스 존재 여부 확인
        """
        if not self.client:
            print("⚠️ connect()가 호출되지 않아 client가 없습니다.")
            return

        try:
            # 1. Ping 테스트
            if await self.client.ping():
                print("✅ Elasticsearch Ping 테스트 성공!")
            else:
                print("❌ Elasticsearch Ping 테스트 실패 (서버는 있으나 정상 응답이 아닙니다.)")

            # 2. 인덱스 확인 ('michelin_recipes'가 있는지)
            index_name = "michelin_recipes"
            exists = await self.client.indices.exists(index=index_name)
            if exists:
                print(f"Index '{index_name}' 찾음")
            else:
                print(f"Index '{index_name}' 찾지 못함.")
                
        # ES 서버와의 연결 자체가 실패했을 경우
        except ConnectionError as e:
            print(f"🚨 Elasticsearch Connection Error: {e}")
        # 그 외 예상하지 못한 에러 발생시
        except Exception as e:
            print(f"🚨 Unexpected ES Error: {e}")

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