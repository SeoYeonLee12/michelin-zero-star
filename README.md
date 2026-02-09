# 👨‍🍳 미슐랭 0스타 (Michelin-zero-Star)

> **"요리흐름을 끊지 않는 나만의 AI 셰프"**

> 사용자의 취향과 상황에 딱 맞는 레시피를 추천하고, 요리하는 모든 과정을 핸즈프리로 도와주는 지능형 쿠킹 어시스턴트 서비스입니다.

<br>

## 📖 프로젝트 개요
**미슐랭 0스타**는 레시피 검색을 넘어 **RAG(Retrieval-Augmented Generation)** 기술을 활용하여 사용자의 모호한 요구사항("스트레스 풀리는 매운 음식 추천해줘")을 이해하여 보유한 레시피 데이터베이스 내에서 가장 적합한 메뉴를 제안합니다. 또한, 요리 중 젖은 손으로 화면을 터치할 필요 없는 **음성 인식(STT) 기반 핸즈프리 Q&A**를 제공합니다.

<br>

## 🚀 핵심 기능

### 1. 🧠 AI 셰프 (지능형 추천)
* **하이브리드 검색 (Hybrid Search):** Elasticsearch의 벡터 검색(kNN)과 키워드 필터링을 결합하여 사용자의 의도를 정확히 파악합니다.
* **페르소나 챗봇:** "미슐랭 0스타" 셰프 페르소나가 적용된 AI가 친절하고 재치 있게 메뉴를 추천합니다.
* **할루시네이션 방지:** 검증된 DB 내 레시피만 추천하며, 적합한 결과가 없을 경우 솔직하게 답변하도록 설계되었습니다.

### 2. 🗣️ 핸즈프리 쿠킹 모드 (Context-Aware Q&A)
* **실시간 조리 가이드:** 현재 사용자가 요리의 어느 단계(Step)를 진행 중인지 AI가 인지하고 있습니다.
* **문맥 인식 답변:** "불은 얼마나 세게 해?", "물 더 넣을까?" 같은 질문에 대해 현재 단계의 레시피 정보를 바탕으로 정확한 조언을 제공합니다.
* **음성 인터랙션:** 요리 중 손을 쓰지 않고 대화로 제어할 수 있습니다.

### 3. 🍳 사용자 맞춤형 서비스
* **OAuth2 로그인:** 간편한 소셜 로그인 지원.
* **개인화 추천:** 사용자의 선호 카테고리(한식, 일식 등)와 대화 이력을 반영한 추천.

<br>

## 🛠️ 시스템 아키텍처

### 🏗️ Tech Stack

| 분류 | 기술 스택 |
| :-- | :-- |
| **Frontend** | Next.js, React|
| **Backend** | Java, Spring Boot, JPA |
| **AI / Serving** | Python, FastAPI, LangChain, OpenAI API (GPT-4o-mini) |
| **Database** | MySQL (RDB), Elasticsearch (Vector DB), Redis (Cache/Session) |
| **Infra** | AWS EC2, Docker Compose, Nginx (SSL/Reverse Proxy) |

### 🧩 AI 활용 (RAG & STT)
1. **Embedding:** `text-embedding-3-large` 모델을 사용하여 레시피 데이터와 사용자 질문을 벡터화.
2. **Retrieval:** Elasticsearch를 통해 의미적으로 가장 유사한 레시피 Top-k 추출.
3. **Filtering:** 임계값(Threshold 0.6) 미만 데이터 필터링 및 메타데이터(카테고리) 적용.
4. **Generation:** 검색된 Context와 현재 요리 단계를 프롬프트에 주입하여 GPT-4o-mini가 최종 답변 생성.
5. **STT:** 키워드 기반 동작, AI 챗봇과 연결 

<br>


## 📂 협업 문서 & 기술개발 문서
### 협업 문서
- [Branch 전략](https://www.notion.so/Branch-2e21b7d769d981d2ac04d59ee246cec7?source=copy_link)

- [Pull Request / Merge Request ](https://www.notion.so/Pull-Request-Merge-Request-2e21b7d769d9815abe40f9e70bfde069?source=copy_link)

- [API 명세서](https://www.notion.so/API-2f41b7d769d980a7b57cdb73167219e6?source=copy_link)

- [Back & AI API 명세서](https://www.notion.so/Back-AI-API-2f01b7d769d980e59916e1f3f60956e5?source=copy_link)

### 기술 개발 문서
- [[AI] 레시피 단계 기반 Q&A 요청 구조 설계](https://www.notion.so/AI-Q-A-2f01b7d769d980539d59c1cf617ba953?source=copy_link)

- [[Infra] Nginx를 활용한 SSL Termination 및 하드웨어 권한 해결](https://www.notion.so/Infra-Nginx-SSL-Termination-2f71b7d769d980dd8852e12900cc245a?source=copy_link)

- [[Infra] Nginx 리버스 프록시를 통한 서비스 보안 및 안정성 강화](https://www.notion.so/Infra-Nginx-2f71b7d769d980989858e33281526734?source=copy_link)

- [[TroubleShooting] Cookie & Local Storage 전환](https://www.notion.so/TroubleShooting-Cookie-Local-Storage-2f71b7d769d980ee95cafd2c599b5b34?source=copy_link)

- [[BE] 비동기 서비스에서 발행한 이벤트가 TransactionPhase.AFTER_COMMIT 리스너를 트리거하지 못하는 원인과 해결](https://www.notion.so/BE-3021b7d769d9805593d3f4e6239e1e96?source=copy_link)

- [[TroubleShooting] MySQL-ES 데이터 파이프라인 구축 및 인덱싱 이슈 해결](https://www.notion.so/DE_TroubleShooting-MySQL-ES-3021b7d769d98053b541c370b7b818ae?source=copy_link)

## 📂 프로젝트 구조

```bash
michelin-zero-star/
├── ai-serving/         # FastAPI (AI Logic & RAG)
├── backend/            # Spring Boot (API Server)
├── data-pipeline/      # Data Processing (ETL/Crawling)
├── exec/               # Porting Manual & Project Specs
├── frontend/           # Next.js (Client)
├── images/             # Project Assets
├── infra/              # Infrastructure Config (Nginx, etc.)
├── .env                # Environment Variables
├── .gitignore
├── docker-compose.yml  # Container Orchestration
├── michelin_dump.sql   # Database Initialization Dump
├── qna_test.json       # AI Q&A Test Data
└── README.md