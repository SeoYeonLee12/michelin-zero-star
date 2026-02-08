# 2. 외부 서비스 정보

본 프로젝트는 서비스 운영 및 기능 구현을 위해 다음과 같은 **외부 서비스의 가입 및 활용**이 필요하다. 환경 설정 및 배포 정보는 [1. 개발 및 실행 환경](01_environment.md)을 참조한다.

---

## 2-1. 소셜 로그인 (OAuth2)

### 2-1-1. Google OAuth2

**사용 목적:**
- Google 계정을 이용한 소셜 로그인
- 사용자 이메일, 이름, 프로필 이미지 자동 조회

**가입 및 설정 단계:**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속 (Google 계정 필수)
2. 새 프로젝트 생성 (프로젝트명: 예) Michelin Zero Star)
3. **API 활성화:**
   - API 및 서비스 > 라이브러리
   - "Google+ API" 검색 후 활성화
   - "OAuth 2.0 API" 활성화
4. **OAuth 2.0 클라이언트 ID 생성:**
   - API 및 서비스 > 인증정보
   - "인증정보 만들기" > "OAuth 클라이언트 ID"
   - 애플리케이션 유형: 웹 애플리케이션
5. **승인된 리다이렉트 URI 설정:**
   - 개발 환경:
     ```
     http://localhost:8080/login/oauth2/code/google
     ```
   - 배포 환경:
     ```
     https://your-domain.com/login/oauth2/code/google
     ```
6. **Client ID & Secret 저장:**
   - 생성 후 표시되는 "클라이언트 ID"와 "클라이언트 보안 비밀번호" 복사
   - `.env` 파일에 저장 (절대 공개 금지)

**필수 환경 변수:**
```bash
GOOGLE_CLIENT_ID=<google_client_id>
GOOGLE_CLIENT_SECRET=<google_client_secret>
```

**설정 파일:**
- Backend: `src/main/resources/application.yml`
  ```yaml
  spring:
    security:
      oauth2:
        client:
          registration:
            google:
              client-id: ${GOOGLE_CLIENT_ID}
              client-secret: ${GOOGLE_CLIENT_SECRET}
              scope: [email, profile]
          provider:
            google:
              user-name-attribute: sub
  ```

**로그인 흐름:**
1. 프론트엔드: 사용자가 "Google로 로그인" 버튼 클릭
2. 리다이렉트: Google 인증 페이지로 이동
3. 인증: 사용자가 Google 계정으로 로그인
4. 콜백: 백엔드의 `/login/oauth2/code/google` 엔드포인트로 리다이렉트
5. 처리: `CustomOAuth2UserService`에서 사용자 정보 조회 및 저장

---

### 2-1-2. Kakao OAuth2

**사용 목적:**
- Kakao 계정을 이용한 소셜 로그인
- Kakao Map API를 통한 지리적 정보(주소→좌표, 좌표→주소) 변환

**가입 및 설정 단계:**

1. [Kakao Developers](https://developers.kakao.com/) 접속 (Kakao 계정 필수)
2. 애플리케이션 생성
   - "내 애플리케이션" > "애플리케이션 추가"
   - 앱 이름 입력 및 생성
3. **App Key 확인:**
   - 생성된 애플리케이션의 "앱 설정" 메뉴
   - "REST API 키" 복사 (후에 KAKAO_REST_API_KEY로 사용)
4. **Kakao Login 활성화:**
   - "제품" > "카카오 로그인" 선택
   - "활성화 설정" 진행
5. **리다이렉트 URI 등록:**
   - 카카오 로그인 설정 > "리다이렉트 URI"
   - 개발 환경:
     ```
     http://localhost:8080/login/oauth2/code/kakao
     ```
   - 배포 환경:
     ```
     https://your-domain.com/login/oauth2/code/kakao
     ```
6. **Client Secret 발급:**
   - "제품" > "카카오 로그인" > "보안"
   - "Client Secret" 코드 생성 (필수)
7. **Kakao Map API 활성화:**
   - "제품" > "카카오 맵" 추가
   - API 키 확인 (REST API 키와 동일)

**필수 환경 변수:**
```bash
KAKAO_CLIENT_ID=<kakao_app_id>
KAKAO_CLIENT_SECRET=<kakao_client_secret>
KAKAO_REST_API_KEY=<kakao_rest_api_key>
```

**주의사항:**
- KAKAO_CLIENT_ID와 KAKAO_REST_API_KEY 값이 동일함
- Client Secret은 보안이 중요하므로 절대 공개 금지

**설정 파일:**
- Backend: `src/main/resources/application.yml`
  ```yaml
  spring:
    security:
      oauth2:
        client:
          registration:
            kakao:
              client-id: ${KAKAO_CLIENT_ID}
              client-secret: ${KAKAO_CLIENT_SECRET}
              client-authentication-method: client_secret_post
              authorization-grant-type: authorization_code
              scope: [profile_nickname, profile_image, account_email]
  kakao:
    rest-api-key: ${KAKAO_REST_API_KEY}
  ```

**활용 기능:**
- 사용자 인증: OAuth2 로그인 프로세스
- 주소 변환: `KakaoApiService.getRegionInfo()` 메서드로 좌표를 주소로 변환

---

### 2-1-3. Naver OAuth2

**사용 목적:**
- Naver 계정을 이용한 소셜 로그인
- 사용자 이메일, 이름, 프로필 이미지 자동 조회

**가입 및 설정 단계:**

1. [Naver Developers](https://developers.naver.com/) 접속 (Naver 계정 필수)
2. 애플리케이션 등록
   - "애플리케이션" > "등록" 클릭
   - 앱 이름, 사용할 API 선택
3. **Naver Login API 선택:**
   - "사용할 API" 항목에서 "Naver Login" 체크
4. **리다이렉트 URI 등록:**
   - 개발 환경:
     ```
     http://localhost:8080/login/oauth2/code/naver
     ```
   - 배포 환경:
     ```
     https://your-domain.com/login/oauth2/code/naver
     ```
5. **Client ID & Secret 저장:**
   - 등록 완료 후 표시되는 "Client ID"와 "Client Secret" 복사
   - `.env` 파일에 저장

**필수 환경 변수:**
```bash
NAVER_CLIENT_ID=<naver_client_id>
NAVER_CLIENT_SECRET=<naver_client_secret>
```

**설정 파일:**
- Backend: `src/main/resources/application.yml`
  ```yaml
  spring:
    security:
      oauth2:
        client:
          registration:
            naver:
              client-id: ${NAVER_CLIENT_ID}
              client-secret: ${NAVER_CLIENT_SECRET}
              client-authentication-method: client_secret_post
              authorization-grant-type: authorization_code
              scope: [name, email, profile_image]
          provider:
            naver:
              authorization-uri: https://nid.naver.com/oauth2.0/authorize
              token-uri: https://nid.naver.com/oauth2.0/token
              user-info-uri: https://openapi.naver.com/v1/nid/me
              user-name-attribute: response
  ```

---

## 2-2. 음성 & AI 서비스

### 2-2-1. Azure Cognitive Services - Speech

**사용 목적:**
- 음성 인식 (Speech-to-Text): 사용자의 음성 입력을 텍스트로 변환
- 음성 합성 (Text-to-Speech): 서버의 응답을 음성으로 재생
- 다국어 지원: 한국어 및 영어 등 다국어 처리

**가입 및 설정 단계:**

1. [Azure Portal](https://portal.azure.com/) 접속 (Microsoft 계정 필수)
2. **리소스 생성:**
   - "리소스 만들기" > "AI + Machine Learning" > "Speech"
3. **기본 설정:**
   - 리소스 그룹: 새로 생성 (예: michelin-resource-group)
   - 지역: `Korea Central` (서울, koreacentral)
   - 이름: 예) michelin-speech
   - 가격 책정 계층: Standard S0
4. **리소스 생성:**
   - "검토 및 생성" > "만들기"
5. **키 및 엔드포인트 확인:**
   - 배포 후 "리소스로 이동"
   - 좌측 메뉴 > "키 및 엔드포인트"
   - "KEY 1" 또는 "KEY 2" 복사
   - 지역 정보 확인 (koreacentral)

**필수 환경 변수:**
```bash
SPEECH_KEY=<your_azure_speech_key>
SPEECH_REGION=koreacentral
# 프론트엔드에서 사용 (public)
NEXT_PUBLIC_SPEECH_KEY=<your_azure_speech_key>
NEXT_PUBLIC_SPEECH_REGION=koreacentral
```

**프론트엔드 설정:**
- npm 패키지: `microsoft-cognitiveservices-speech-sdk`
- 구현 위치: Frontend의 음성 입력/출력 컴포넌트
- 환경 변수: docker-compose.yml의 `NEXT_PUBLIC_SPEECH_KEY`, `NEXT_PUBLIC_SPEECH_REGION`

**주의사항:**
- Speech Key는 민감한 정보이므로 `.env` 파일 관리 필수
- 월별 사용량 및 비용 모니터링
- 무료 계층: 월 5시간 제한
- 표준 계층: 종량제 (가격: 약 $4/시간)

**사용 예시:**
```javascript
const speechConfig = SpeechConfig.fromSubscription(
  process.env.NEXT_PUBLIC_SPEECH_KEY,
  process.env.NEXT_PUBLIC_SPEECH_REGION
);
```

---

### 2-2-2. OpenAI API

**사용 목적:**
- GPT 모델을 통한 자연어 처리
- AI 기반 레스토랑/음식 추천
- 사용자 질의응답 및 대화형 AI 기능

**가입 및 설정 단계:**

1. [OpenAI Platform](https://platform.openai.com/) 접속 (OpenAI 계정 필수)
2. **API Key 발급:**
   - 좌측 메뉴 > "API Keys"
   - "Create new secret key" 클릭
   - 키 이름 입력 (예: michelin-zero-star)
   - 키 생성 및 복사 (한 번만 표시됨)
3. **크레딧 충전 및 비용 설정:**
   - "Billing" > "Overview"
   - 신용카드 추가 또는 크레딧 구매
4. **사용량 모니터링 설정:**
   - "Billing" > "Usage limits"
   - 월별 예산 설정 및 알림 설정 (선택사항)
5. **모델 선택:**
   - 현재 권장: `gpt-4` 또는 `gpt-3.5-turbo`
   - 프로젝트 요구사항에 따라 선택

**필수 환경 변수:**
```bash
OPENAI_API_KEY=<your_openai_api_key>
```

**사용 위치:**
- AI Server (FastAPI): `ai-serving/` 디렉토리의 Python 파일
- Docker 환경 변수에 설정
- Backend에서도 필요시 사용 가능

**주의사항:**
- API Key는 절대 공개 금지
- 월별 비용 모니터링 필수
- Rate Limiting: 기본적으로 분당 요청 제한 있음
- 타임아웃 설정 필수 (무한 대기 방지)

**비용 예시 (2024년 기준):**
| 모델 | 입력 (1K 토큰) | 출력 (1K 토큰) |
|------|---------------|----------------|
| gpt-4 | $0.03 | $0.06 |
| gpt-3.5-turbo | $0.0005 | $0.0015 |

**사용 예시 (Python/FastAPI):**
```python
import openai
openai.api_key = os.getenv("OPENAI_API_KEY")

response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "문의 내용"}]
)
```

---

## 2-3. 클라우드 & 인프라 (배포)

### 2-3-1. AWS EC2

> **참고:** AWS EC2 인스턴스 생성, 설정, 보안 그룹 설정 등 상세 정보는 [1-6. 배포 환경 (AWS EC2)](01_environment.md#1-6-배포-환경-aws-ec2)을 참조한다.

**가입 및 인스턴스 생성 단계:**

1. [AWS 콘솔](https://aws.amazon.com/) 접속 (AWS 계정 필수)
2. **EC2 서비스 선택:**
   - "서비스" > "컴퓨팅" > "EC2"
3. **인스턴스 시작:**
   - "인스턴스" > "인스턴스 시작"
4. **이미지 선택:**
   - Ubuntu Server 20.04 LTS (프리 티어 대상)
5. **인스턴스 타입 선택:**
   - 개발: t2.micro (프리 티어)
   - 배포: t2.large 또는 t3.large (메모리 4GB 이상)
6. **스토리지 설정:**
   - 최소 30GB, 권장 50GB 이상
7. **보안 그룹 설정:**
   - HTTP (80), HTTPS (443), SSH (22), 사용자 정의 포트 (3000, 8080 등)
8. **키 페어 생성:**
   - 새 키 페어 생성 및 `.pem` 파일 다운로드 (안전하게 보관)
9. **인스턴스 시작 및 접속:**
   ```bash
   chmod 400 your-key.pem
   ssh -i your-key.pem ubuntu@your-instance-public-ip
   ```

**필수 설정:**
- Docker & Docker Compose 설치
- Elasticsearch 메모리 설정: `vm.max_map_count=262144`
- 보안 그룹: HTTPS 활성화, 필요한 포트만 개방

---

### 2-3-2. AWS 추가 서비스 (선택사항)

**AWS Certificate Manager (ACM) - SSL/TLS 인증서:**
- 무료 SSL/TLS 인증서 발급
- HTTPS 활성화 필수
- Route 53과 연동으로 자동 갱신

**AWS Route 53 - DNS 관리:**
- 도메인 구매 및 DNS 레코드 관리
- EC2 인스턴스 IP와 도메인 연결

**AWS Secrets Manager - 보안 정보 관리:**
- API Key, OAuth Secret 등 민감한 정보 안전 저장
- EC2에서 필요시 자동 로드

---

## 2-4. 형상 관리

### 2-4-1. Git / GitHub

**사용 목적:**
- 소스 코드 버전 관리
- 팀 협업 및 코드 리뷰
- CI/CD 파이프라인 연동 준비

**Repository 정보:**
- URL: `https://github.com/s14-webmobile2-sub1/S14P11B208.git`
- 브랜치 전략:
  - `main`: 배포 가능한 코드 (보호 브랜치)
  - `develop`: 개발 통합 브랜치
  - `feature/*`: 기능별 작업 브랜치

**필수 보안 설정:**
- `.env` 파일 커밋 금지 (`.gitignore`에 추가)
  ```
  *.env
  .env.local
  .env.*.local
  ```
- API Key, Secret 정보 절대 커밋 금지
- 민감 정보 사용 시 환경 변수만 사용

**GitHub Secrets 설정 (CI/CD용):**
- Repository > Settings > Secrets
- 배포 시 필요한 민감 정보 저장
- 예: `AWS_ACCESS_KEY`, `OPENAI_API_KEY` 등

---

## 2-5. 체크리스트

### 개발 환경 준비
- [ ] Google Cloud Console에서 OAuth 앱 생성 및 설정
- [ ] Kakao Developers에서 앱 생성 및 Map API 활성화
- [ ] Naver Developers에서 로그인 API 등록
- [ ] Azure Portal에서 Speech 리소스 생성
- [ ] OpenAI Platform에서 API Key 발급
- [ ] `.env` 파일에 모든 API Key/Secret 입력
- [ ] Git을 통해 `.env` 파일이 커밋되지 않는지 확인

### 배포 환경 준비
- [ ] AWS 계정 생성 및 EC2 인스턴스 시작
- [ ] 배포용 OAuth2 리다이렉트 URI 재설정 (도메인 기반)
- [ ] 배포용 API Key 발급 (비용 제어를 위해 개발용과 분리 권장)
- [ ] AWS Secrets Manager 또는 유사 서비스에 보안 정보 저장
- [ ] SSL/TLS 인증서 설정 (ACM 또는 Let's Encrypt)
- [ ] DNS 설정 (Route 53 또는 도메인 제공업체)
- [ ] 배포 환경 보안 그룹 및 방화벽 규칙 설정
- [ ] 월별 비용 알림 설정 (OpenAI, Azure Speech 등)

---

## 2-6. 보안 주의사항

**절대 공개 금지 정보:**
- Database Password (`PROD_DB_PASSWORD`, `PROD_DB_ROOT_PASSWORD`)
- OAuth2 Client Secret (`GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_SECRET`, `NAVER_CLIENT_SECRET`)
- API Keys (`OPENAI_API_KEY`, `SPEECH_KEY`)
- Git Repository SSH Key (배포용 키 페어)

**관리 방법:**
- 개발 환경: `.env` 파일 (로컬, 버전 관리 제외)
- 배포 환경: AWS Secrets Manager, Azure Key Vault, 환경 변수
- CI/CD: GitHub Secrets, GitLab Variables

**외부 공유 금지:**
- 이슈/PR에 `.env` 내용 붙여넣기 금지
- 스크린샷에 API Key 노출 금지
- 팀 공유 시 별도의 보안 채널 사용
