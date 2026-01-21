FROM python:3.10-slim

# 작업 디렉토리 설정 (컨테이너 내부 경로)
WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 설치: 캐싱 효과를 위해 requirements.txt만 먼저 복사해서 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 전체 복사
COPY . .

# 포트 노출 (문서용, 실제 개방은 docker-compose에서)
EXPOSE 8000

# 실행 명령어
# host 0.0.0.0: 외부 접속 허용
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]