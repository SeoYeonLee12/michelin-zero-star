# 1. 개발 및 실행 환경

## 1-1. 사용 기술 스택

| 카테고리 | 기술/도구 | 버전 |
|---------|---------|------|
| **OS** | Windows 10 / Ubuntu 20.04 LTS (AWS EC2) | - |
| **Frontend** | Next.js | 16.0.10 |
| **Frontend** | React | 19.2.0 |
| **Frontend** | Node.js (Docker) | 20-alpine |
| **Frontend** | TypeScript | 5.x |
| **Backend** | Spring Boot | 3.4.1 |
| **Backend** | Java | 21 |
| **Backend** | Gradle | 8.0+ |
| **Backend** | MySQL Connector | 최신 |
| **Database** | MySQL | 8.0 |
| **Cache** | Redis | 최신 |
| **Search Engine** | Elasticsearch | 8.11.1 |
| **Monitoring** | Kibana | 8.11.1 |
| **AI Server** | FastAPI (Python) | 3.10 |
| **Container** | Docker | 20.10+ |
| **Orchestration** | Docker Compose | v2.0+ |
| **Cloud** | AWS EC2 | - |

---

## 1-2. 환경 변수 설정

본 프로젝트는 Docker Compose 기반으로 실행되며, 환경 변수는 프로젝트 루트의 `.env` 파일을 통해 관리된다.

### 환경 변수 목록

### 환경 변수 목록

| 변수명 | 설명 | 필수 | 기본값 | 비고 |
|------|------|------|--------|------|
| **Database (필수)** | | | | |
| PROD_DB_HOST | MySQL 호스트 주소 | O | db | Docker Compose 서비스명 |
| PROD_DB_PORT | MySQL 포트 | O | 3306 | 기본 MySQL 포트 |
| PROD_DB_NAME | 데이터베이스 이름 | O | michelin-zero-star | MYSQL_DATABASE 설정값 |
| PROD_DB_USER | MySQL 일반 사용자명 | O | michelin-prod-user | MYSQL_USER 설정값 |
| PROD_DB_PASSWORD | MySQL 일반 사용자 비밀번호 | O | <STRONG_PASSWORD> | MYSQL_PASSWORD 설정값, 강력한 비밀번호 필수 |
| PROD_DB_ROOT_PASSWORD | MySQL Root 비밀번호 | O | <STRONG_PASSWORD> | MYSQL_ROOT_PASSWORD 설정값, 강력한 비밀번호 필수 |
| **Application (필수)** | | | | |
| PROD_APP_PORT | 백엔드 서버 외부 포트 | O | 8080 | 내부 포트는 항상 8080 |
| **AI & API Keys** | | | | |
| GMS_KEY | GMS 서비스 키 | - | <PROJECT_GMS_KEY> | 프로젝트별 고유 키 |
| OPENAI_API_KEY | OpenAI API Key | - | <YOUR_OPENAI_API_KEY> | AI 기능 사용 시 필수 |
| PROJECT_NAME | AI 프로젝트 이름 | - | MZS-AI | docker-compose에서 고정 |
| ES_URL | Elasticsearch URL | - | http://localhost:9200 | docker-compose에서 고정 |
| SPEECH_KEY | Azure Cognitive Services Speech Key | - | <YOUR_SPEECH_KEY> | 음성 인식/합성 기능 필수 |
| SPEECH_REGION | Azure Speech 지역 | - | koreacentral | 음성 서비스 지역 |
| FILE_UPLOAD_DIR | 파일 업로드 디렉토리 경로 | - | /app/images | 컨테이너 내부 경로 |
| **OAuth2 (Google)** | | | | |
| GOOGLE_CLIENT_ID | Google OAuth2 Client ID | - | <YOUR_GOOGLE_CLIENT_ID> | Google 로그인 활성화 시 필수 |
| GOOGLE_CLIENT_SECRET | Google OAuth2 Client Secret | - | <YOUR_GOOGLE_CLIENT_SECRET> | Google 로그인 활성화 시 필수 |
| **OAuth2 (Kakao)** | | | | |
| KAKAO_CLIENT_ID | Kakao OAuth2 Client ID | - | <YOUR_KAKAO_CLIENT_ID> | Kakao 로그인 활성화 시 필수 |
| KAKAO_CLIENT_SECRET | Kakao OAuth2 Client Secret | - | <YOUR_KAKAO_CLIENT_SECRET> | Kakao 로그인 활성화 시 필수 |
| KAKAO_REST_API_KEY | Kakao REST API Key | - | <YOUR_KAKAO_REST_API_KEY> | Kakao API 호출 시 필수 |
| **OAuth2 (Naver)** | | | | |
| NAVER_CLIENT_ID | Naver OAuth2 Client ID | - | <YOUR_NAVER_CLIENT_ID> | Naver 로그인 활성화 시 필수 |
| NAVER_CLIENT_SECRET | Naver OAuth2 Client Secret | - | <YOUR_NAVER_CLIENT_SECRET> | Naver 로그인 활성화 시 필수 |

### .env 파일 생성 예시

프로젝트 루트 디렉토리(`michelin-zero-star/`)에 `.env` 파일을 생성하고 아래 내용을 작성한다.

#### 로컬 개발 환경 (.env)
```bash
# ============================================
# Database Configuration (필수)
# ============================================
PROD_DB_HOST=db
PROD_DB_PORT=3306
PROD_DB_NAME=michelin-zero-star
PROD_DB_USER=michelin-prod-user
PROD_DB_PASSWORD=<STRONG_DB_PASSWORD>
PROD_DB_ROOT_PASSWORD=<STRONG_DB_PASSWORD>

# ============================================
# Application Configuration (필수)
# ============================================
PROD_APP_PORT=8080

# ============================================
# AI & Services Configuration
# ============================================
GMS_KEY=<PROJECT_GMS_KEY>
OPENAI_API_KEY=<OPENAI_API_KEY>
PROJECT_NAME=MZS-AI
ES_URL=http://localhost:9200

# ============================================
# Azure Speech Configuration
# ============================================
SPEECH_KEY=<AZURE_SPEECH_KEY>
SPEECH_REGION=koreacentral

# ============================================
# OAuth2 Configuration (Google)
# ============================================
GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET>

# ============================================
# OAuth2 Configuration (Kakao)
# ============================================
KAKAO_CLIENT_ID=<KAKAO_CLIENT_ID>
KAKAO_CLIENT_SECRET=<KAKAO_CLIENT_SECRET>
KAKAO_REST_API_KEY=<KAKAO_REST_API_KEY>

# ============================================
# OAuth2 Configuration (Naver)
# ============================================
NAVER_CLIENT_ID=<NAVER_CLIENT_ID>
NAVER_CLIENT_SECRET=<NAVER_CLIENT_SECRET>

# ============================================
# File Upload Configuration
# ============================================
FILE_UPLOAD_DIR=/app/images
```

**주의사항:**
- `PROD_DB_PASSWORD`, `PROD_DB_ROOT_PASSWORD`: 운영 환경에서는 반드시 강력한 비밀번호로 설정
- `OPENAI_API_KEY`: 실제 OpenAI API Key로 변경 필수 (프로젝트 내 임시 값은 테스트용)
- `GMS_KEY`: 프로젝트별 고유 키, 절대 공개하지 말 것
- `SPEECH_KEY`: Azure Cognitive Services 계정에서 발급받은 키 필수
- `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_SECRET`, `NAVER_CLIENT_SECRET`: 절대 공개하지 말 것
- `.env` 파일은 Git에 커밋하지 않도록 주의 (.gitignore에 추가)
- 다음 환경변수는 docker-compose.yml에서 자동 설정됨 (추가할 필요 없음):
  - `SPRING_PROFILES_ACTIVE=prod`
  - `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
  - `DB_HOST=db`, `DB_PORT=3306`
  - `SPRING_DATA_REDIS_HOST=redis`, `SPRING_DATA_REDIS_PORT=6379`
  - `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`
  - `PYTHONUNBUFFERED=1`

---

## 1-3. 사전 요구사항

### 로컬 개발 환경
- **Docker**: 20.10 이상
- **Docker Compose**: v2.0 이상
- **Git**: 버전 관리 및 저장소 클론
- **Java**: 21 (로컬 백엔드 빌드 시)
- **Node.js**: 20.x (프론트엔드 로컬 개발 시, Dockerfile에서 node:20-alpine 사용)

### 설치 확인
```bash
# Docker 버전 확인
docker --version
# 예상 출력: Docker version 20.10.x

# Docker Compose 버전 확인
docker-compose --version
# 예상 출력: Docker Compose version v2.x.x

# Java 버전 확인 (로컬 빌드 시)
java -version
# 예상 출력: openjdk version "21"

# Node.js 버전 확인 (프론트엔드 로컬 개발 시)
node --version
# 예상 출력: v20.x.x
```

---

## 1-4. 실행 방법

### 1단계: 저장소 클론 및 디렉토리 이동

```bash
git clone <https://lab.ssafy.com/s14-webmobile2-sub1/S14P11B208.git>
cd michelin-zero-star
```

### 2단계: 환경 변수 파일 생성

프로젝트 루트 디렉토리에 `.env` 파일을 생성한다.

```bash
# 예시 내용으로 파일 생성
cat > .env << 'EOF'
PROD_DB_HOST=db
PROD_DB_PORT=3306
PROD_DB_NAME=michelin-zero-star
PROD_DB_USER=michelin-prod-user
PROD_DB_PASSWORD=<YOUR_STRONG_PASSWORD>
PROD_DB_ROOT_PASSWORD=<YOUR_STRONG_PASSWORD>
PROD_APP_PORT=8080
GMS_KEY=<YOUR_GMS_KEY>
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
PROJECT_NAME=MZS-AI
ES_URL=http://localhost:9200
SPEECH_KEY=<YOUR_SPEECH_KEY>
SPEECH_REGION=koreacentral
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
KAKAO_CLIENT_ID=<YOUR_KAKAO_CLIENT_ID>
KAKAO_CLIENT_SECRET=<YOUR_KAKAO_CLIENT_SECRET>
KAKAO_REST_API_KEY=<YOUR_KAKAO_REST_API_KEY>
NAVER_CLIENT_ID=<YOUR_NAVER_CLIENT_ID>
NAVER_CLIENT_SECRET=<YOUR_NAVER_CLIENT_SECRET>
FILE_UPLOAD_DIR=/app/images
EOF
```

### 3단계: Docker Compose를 이용한 실행

#### 3-1) 애플리케이션 시작
```bash
# 백그라운드에서 실행 (권장)
docker-compose up -d --build

# 또는 로그를 보면서 실행
docker-compose up --build
```

#### 3-2) 실행 상태 확인
```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 예상 출력:
# NAME                    STATUS
# michelin-backend        Up X seconds
# michelin-db             Up X seconds
# michelin-redis-local    Up X seconds
# mzs-es                  Up X seconds
# mzs-kibana              Up X seconds
# mzs-ai                  Up X seconds
# michelin-frontend       Up X seconds

# 서비스별 로그 확인
docker-compose logs -f [service_name]

# 예시: 백엔드 로그 확인
docker-compose logs -f backend

# 예시: 데이터베이스 로그 확인
docker-compose logs -f db
```

#### 3-3) 애플리케이션 중지
```bash
# 컨테이너 중지
docker-compose down

# 이미지 및 볼륨까지 완전 제거 (주의: 데이터 손실)
docker-compose down -v
```

---

## 1-5. 서비스 접근 정보

| 서비스 | URL/Address | 포트 | 컨테이너명 | 설명 |
|--------|-------------|------|---------|------|
| **Frontend** | http://localhost:3000 | 3000 | michelin-frontend | Next.js 웹 애플리케이션 |
| **Backend API** | http://localhost:8080/api/v1 | PROD_APP_PORT | michelin-backend | Spring Boot REST API (포트는 .env의 PROD_APP_PORT로 제어) |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | PROD_APP_PORT | michelin-backend | Spring Boot API 문서 및 테스트 |
| **MySQL** | localhost:PROD_DB_PORT | PROD_DB_PORT | michelin-db | 데이터베이스 (기본 3306) |
| **Redis** | localhost:6379 | 6379 | michelin-redis-local | 캐시 서버 (고정 포트) |
| **Elasticsearch** | http://localhost:9200 | 9200 | mzs-es | 검색 엔진 |
| **Kibana** | http://localhost:5601 | 5601 | mzs-kibana | Elasticsearch 모니터링/관리 UI |
| **AI Server** | http://localhost:8000 | 8000 | mzs-ai | FastAPI 기반 AI 서빙 서버 |

### 데이터베이스 접속 정보

**MySQL 접속:**
```bash
# Docker 컨테이너 내에서 접속
docker-compose exec db mysql -h localhost -u root -p
# 비밀번호: .env의 PROD_DB_ROOT_PASSWORD 입력

# 또는 로컬 MySQL 클라이언트로 접속
mysql -h 127.0.0.1 -P 3306 -u michelin -p
# 비밀번호: .env의 PROD_DB_PASSWORD 입력
```

**데이터베이스 확인:**
```bash
# 데이터베이스 목록 확인
docker-compose exec db mysql -u root -p -e "SHOW DATABASES;"

# 사용자 확인
docker-compose exec db mysql -u root -p -e "SELECT user, host FROM mysql.user;"
```

**Redis 접속:**
```bash
# Redis CLI 접속
docker-compose exec redis redis-cli

# Redis 데이터 확인
docker-compose exec redis redis-cli KEYS "*"

# Redis 연결 테스트
docker-compose exec redis redis-cli ping
# 응답: PONG
```

### Docker Compose 네트워크 정보

- **네트워크명**: `mzs-network` (bridge 드라이버)
- **내부 통신**: 컨테이너명으로 서로 통신 가능
  - 백엔드 → DB: `db:3306`
  - 백엔드 → Redis: `redis:6379`
  - 백엔드 → Elasticsearch: `elasticsearch:9200`
  - 백엔드 → AI Server: `ai-serving:8000`
  - Kibana → Elasticsearch: `elasticsearch:9200`
  - AI Server → Elasticsearch: `elasticsearch:9200`

---

## 1-6. 배포 환경 (AWS EC2)

### 배포 서버 사양
- **OS**: Ubuntu 20.04 LTS
- **인스턴스 타입**: t2.large 이상 (권장: t3.large 또는 상위)
- **메모리**: 최소 4GB (Elasticsearch 및 AI 서버 실행을 위해 8GB 권장)
- **디스크**: 최소 30GB (데이터베이스 및 로그를 위해 50GB 이상 권장)
- **방식**: Docker Compose 기반 배포

### 필수 사전 설정

#### 1. Docker & Docker Compose 설치
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치 (v2.x 권장)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 버전 확인
docker --version
docker-compose --version
```

#### 2. 메모리 설정 (Elasticsearch 실행을 위해 필수)
```bash
# 호스트 메모리 최대값 해제
sudo sysctl -w vm.max_map_count=262144

# 영구 설정
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### EC2 보안 그룹 인바운드 규칙

| 포트 | 프로토콜 | 서비스 | 소스 | 설명 |
|------|---------|--------|------|------|
| 443 | TCP | HTTPS | 0.0.0.0/0 | SSL/TLS 보안 트래픽 (필수) |
| 80 | TCP | HTTP | 0.0.0.0/0 | HTTP 트래픽 (리다이렉트용) |
| 3000 | TCP | Frontend | 0.0.0.0/0 | Next.js 애플리케이션 (선택: 리버스 프록시 뒤에 있는 경우 불필요) |
| 8080 | TCP | Backend API | 0.0.0.0/0 | Spring Boot REST API (선택: 리버스 프록시 뒤에 있는 경우 불필요) |
| 9200 | TCP | Elasticsearch | 내부 IP만 | 검색 엔진 (외부 접근 차단 필수) |
| 5601 | TCP | Kibana | 내부 IP만 | 모니터링 (외부 접근 차단 필수, VPN/Bastion을 통해서만 접근) |
| 8000 | TCP | AI Server | 내부 IP만 | FastAPI AI 서빙 (외부 접근 차단 필수) |
| 22 | TCP | SSH | Admin IP | 관리자 SSH 접근 (특정 IP만 허용) |

### 배포 환경 .env 파일 설정

```bash
# ============================================
# Database Configuration (강력한 비밀번호 필수)
# ============================================
PROD_DB_HOST=db
PROD_DB_PORT=3306
PROD_DB_NAME=michelin-zero-star
PROD_DB_USER=michelin-prod-user
PROD_DB_PASSWORD=<강력한_비밀번호_여기_입력>
PROD_DB_ROOT_PASSWORD=<강력한_루트_비밀번호_여기_입력>

# ============================================
# Application Configuration
# ============================================
PROD_APP_PORT=8080

# ============================================
# AI & Services Configuration
# ============================================
GMS_KEY=<프로젝트_GMS_KEY>
OPENAI_API_KEY=<배포_환경_OpenAI_API_Key>
PROJECT_NAME=MZS-AI
ES_URL=http://elasticsearch:9200

# ============================================
# Azure Speech Configuration
# ============================================
SPEECH_KEY=<배포_환경_Azure_Speech_Key>
SPEECH_REGION=koreacentral

# ============================================
# OAuth2 Configuration (배포용 클라이언트로 수정 필수)
# ============================================
# Google OAuth
GOOGLE_CLIENT_ID=<배포_환경_Google_Client_ID>
GOOGLE_CLIENT_SECRET=<배포_환경_Google_Secret>

# Kakao OAuth & Map
KAKAO_CLIENT_ID=<배포_환경_Kakao_Client_ID>
KAKAO_CLIENT_SECRET=<배포_환경_Kakao_Secret>
KAKAO_REST_API_KEY=<배포_환경_Kakao_REST_API_Key>

# Naver OAuth
NAVER_CLIENT_ID=<배포_환경_Naver_Client_ID>
NAVER_CLIENT_SECRET=<배포_환경_Naver_Secret>

# ============================================
# File Upload Configuration
# ============================================
FILE_UPLOAD_DIR=/app/images
```

### 배포 체크리스트

- [ ] EC2 인스턴스 메모리 및 디스크 충분 (최소 8GB 메모리, 50GB 디스크)
- [ ] Docker & Docker Compose 설치 확인
- [ ] `vm.max_map_count=262144` 설정 확인
- [ ] 보안 그룹 규칙 설정 (HTTPS 포트 443, 내부 포트는 차단)
- [ ] 도메인명 구매 및 DNS 설정
- [ ] SSL/TLS 인증서 취득 (Let's Encrypt 또는 AWS Certificate Manager)
- [ ] 리버스 프록시 설정 (Nginx 또는 AWS Load Balancer)
- [ ] 데이터베이스 자동 백업 정책 수립
- [ ] 모니터링 및 로깅 설정 (CloudWatch, ELK Stack 등)
- [ ] 배포 환경용 OAuth2 클라이언트 ID/Secret 발급
- [ ] HTTPS 리다이렉트 설정
- [ ] 세션 타임아웃 및 보안 설정 검토

---

## 1-7. 유용한 Docker 명령어

### 컨테이너 관리
```bash
# 모든 컨테이너 상태 확인
docker-compose ps

# 특정 서비스만 재시작
docker-compose restart [service_name]

# 특정 서비스만 중지
docker-compose stop [service_name]

# 특정 서비스만 시작
docker-compose start [service_name]

# 컨테이너 내 명령 실행
docker-compose exec [service_name] [command]

# 예: 백엔드 로그 확인
docker-compose logs -f backend

# 예: 데이터베이스 초기화 스크립트 확인
docker-compose exec db ls /docker-entrypoint-initdb.d
```

### 이미지 및 빌드 관리
```bash
# 특정 서비스만 재빌드
docker-compose up -d --build [service_name]

# 캐시 무시하고 재빌드
docker-compose build --no-cache

# 이전 이미지 완전 제거 후 재실행
docker system prune -a
docker-compose up -d --build

# 이미지 목록 확인
docker images
```

### 데이터베이스 작업
```bash
# MySQL 접속
docker-compose exec db mysql -h localhost -u root -p

# 데이터베이스 목록 확인
docker-compose exec db mysql -u root -p -e "SHOW DATABASES;"

# 특정 데이터베이스 덤프
docker-compose exec db mysqldump -u root -p michelin > backup.sql

# Redis CLI 접속
docker-compose exec redis redis-cli

# Redis 데이터 확인
docker-compose exec redis redis-cli KEYS "*"
```

### 볼륨 및 정리
```bash
# 볼륨 목록 확인
docker volume ls

# 사용하지 않는 볼륨 삭제
docker volume prune

# 전체 정리 (주의: 데이터 손실)
docker-compose down -v
docker system prune -a --volumes
```

---

## 1-8. 트러블슈팅

### 포트 충돌 오류
**증상**: `Port X is already allocated`

**해결방법**:
```bash
# Windows PowerShell에서 포트 사용 확인
netstat -ano | findstr :8080

# Linux/Mac에서 포트 사용 확인
lsof -i :8080

# 해당 프로세스 종료 (Windows, PID로 종료)
taskkill /PID <PID> /F

# Linux/Mac에서 프로세스 종료
kill -9 <PID>

# 또는 docker-compose.yml에서 포트 수정
# PROD_APP_PORT=8081 로 변경
```

### 컨테이너 빌드 실패
**증상**: `Docker build failed` 또는 `Build error`

**해결방법**:
```bash
# 캐시 무시하고 재빌드
docker-compose build --no-cache

# 이전 이미지 확인
docker images | grep michelin

# 이전 이미지 삭제
docker rmi [image_id]

# 전체 정리 후 재시작
docker system prune -a
docker-compose up -d --build
```

### 데이터베이스 연결 오류
**증상**: `Unable to connect to database` 또는 `JDBC connection error`

**해결방법**:
```bash
# 1. .env 파일 설정 확인
cat .env | grep PROD_DB

# 2. 데이터베이스 컨테이너 상태 확인
docker-compose logs db

# 3. 데이터베이스 접속 테스트
docker-compose exec db mysql -h localhost -u root -p -e "SHOW DATABASES;"

# 4. 네트워크 확인
docker network ls
docker network inspect mzs-network

# 5. 컨테이너 재시작
docker-compose restart db
docker-compose restart backend
```

### Redis 연결 오류
**증상**: `Cannot connect to redis` 또는 `redis timeout`

**해결방법**:
```bash
# Redis 상태 확인
docker-compose logs redis

# Redis 연결 테스트
docker-compose exec redis redis-cli ping
# 예상 응답: PONG

# Redis 재시작
docker-compose restart redis
```

### Elasticsearch 시작 오류
**증상**: `memory lock failed` 또는 `bootstrap checks failed`

**해결방법**:
```bash
# Docker 메모리 설정 확인 및 증가
docker info | grep "Memory"

# docker-compose.yml의 Elasticsearch 환경변수 확인
# ES_JAVA_OPTS: -Xms256m -Xmx256m 값을 필요에 따라 증가

# 호스트 시스템 메모리 확인
free -h  # Linux
Get-WmiObject -Class Win32_ComputerSystem | Select-Object TotalPhysicalMemory  # Windows
```

### 프론트엔드 빌드 오류
**증상**: `Next.js build failed` 또는 `Module not found`

**해결방법**:
```bash
# 프론트엔드 컨테이너 로그 확인
docker-compose logs frontend

# node_modules 캐시 제거 후 재빌드
docker-compose down frontend
rm -rf frontend/node_modules frontend/.next
docker-compose up -d --build frontend

# 또는 프론트엔드 컨테이너만 재빌드
docker-compose up -d --build frontend --no-deps
```

---

## 1-9. 기타 유의사항

### 컨테이너 및 네트워크
- Docker Desktop이 실행 중이어야 한다.
- 모든 서비스는 `mzs-network` (bridge 네트워크)를 통해 연결된다.
- 컨테이너명으로 내부 통신 가능: `db`, `redis`, `elasticsearch`, `ai-serving` 등

### 포트 관리
- 동일 포트를 사용하는 프로세스가 존재할 경우 컨테이너 실행이 실패할 수 있다.
- 포트 충돌 발생 시 기존 프로세스 종료 후 재실행한다.
- 고정 포트:
  - Redis: 6379 (변경 불가)
  - Elasticsearch: 9200 (변경 불가)
  - Kibana: 5601 (변경 불가)
  - AI Server: 8000 (변경 불가)
- 변동 포트:
  - Frontend: 3000 (고정)
  - Backend: PROD_APP_PORT (기본값 8080, .env에서 변경 가능)
  - MySQL: PROD_DB_PORT (기본값 3306, .env에서 변경 가능)

### 로그 및 디버깅
- 로컬 개발 환경에서는 `SPRING_PROFILES_ACTIVE=dev`로 변경하여 더 자세한 로그를 볼 수 있다.
  - docker-compose.yml의 `backend` 서비스 환경변수 수정 후 재시작
- 각 컨테이너의 로그 확인: `docker-compose logs -f [service_name]`

### 데이터베이스 관리
- 데이터베이스는 초기 시작 시 `./infra/mysql` 디렉토리의 초기화 스크립트를 자동으로 실행한다.
- MySQL healthcheck 설정: 10초 간격, 5초 타임아웃, 5회 재시도
- 데이터는 `db_data` 볼륨에 저장되며, 컨테이너 삭제 후에도 데이터가 유지된다.

### 파일 업로드
- 파일 업로드는 `./images` 디렉토리에 저장되며, 볼륨 매핑으로 호스트와 동기화된다.
- 컨테이너 내부 경로: `/images`
- 호스트 경로: `./images`

### 보안 및 인증
- 프로덕션 환경 배포 시 `.env` 파일의 민감한 정보는 반드시 보안을 고려하여 관리해야 한다:
  - `PROD_DB_PASSWORD`: 강력한 비밀번호 필수
  - `PROD_DB_ROOT_PASSWORD`: 강력한 비밀번호 필수
  - OAuth2 Secret: 배포 환경용 별도 클라이언트 필수
  - `OPENAI_API_KEY`: API 사용량 모니터링 필요
  - `NEXT_PUBLIC_SPEECH_KEY`: Azure 계정 보안 설정 필수
- OAuth2 리다이렉트 URI는 정확히 일치해야 함 (프로토콜, 도메인, 포트 모두)
- `.env` 파일은 Git에 커밋하지 않도록 주의 (.gitignore에 추가)

### WebSocket 설정
- WebSocket 기능이 활성화되어 있으므로 리버스 프록시(Nginx 등) 설정 시 WebSocket 업그레이드 설정을 추가해야 한다.

```nginx
# Nginx WebSocket 설정 예시
location /ws-stomp {
    proxy_pass http://backend:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 프로덕션 배포 고려사항
- Elasticsearch 메모리 설정: 기본값 `-Xms256m -Xmx256m` (필요시 증가)
- 데이터베이스 자동 백업 정책 수립
- 정기적인 로그 정리 및 모니터링
- SSL/TLS 인증서 갱신 자동화
- CI/CD 파이프라인 구성
- 컨테이너 이미지 레지스트리 사용 (Docker Hub, AWS ECR 등)
