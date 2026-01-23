# michelin-zero-star > ai-serving > app > services > rag_service.py

from typing import List, Tuple
from langchain_openai import OpenAIEmbeddings, ChatOpenAI # langchain 제공 open ai 임베딩, chat 모델
from langchain.schema import SystemMessage, HumanMessage, AIMessage # llm에 전달되는 메시지 타입
from langchain_community.chat_message_histories import ChatMessageHistory # 사용자별 대화 이력을 메모리로 관리하기 위한 클래스

# 프로젝터 설정 & ES 클라이언트 & API 요청/응답에 사용되는 DTO
from app.core.config import settings 
from app.core.database import es_client
from app.schemas.chat import RecipeInfo, StepDetail, ChatMessage


# --------------------------------------------------
# 세션별 대화 이력을 관리하기 위한 in-memory store
# (user_id 또는 session_id 기준으로 대화 흐름 유지)
# --------------------------------------------------
session_store = {}

def get_session_history(session_id: str) -> ChatMessageHistory:
    """
    사용자별 대화 히스토리 반환
    - 기존 세션 있으면 재사용
    - 없으면 새로 생성
    """
    if session_id not in session_store:
        session_store[session_id] = ChatMessageHistory()
    return session_store[session_id]

class RagService:
    def __init__(self):
        # GMS Base URL
        gms_base_url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-large",
                                           openai_api_key=settings.OPENAI_API_KEY,
                                           base_url=gms_base_url)
        self.llm = ChatOpenAI(model="gpt-4o-mini", 
                              temperature=0.7,
                              openai_api_key=settings.OPENAI_API_KEY,
                              base_url=gms_base_url)

    # RAG: 하이브리드 검색 (복수 카테고리 필터링)
    async def search_es(self, query: str, categories: List[str]) -> Tuple[List[RecipeInfo], str, float]:
        # 1. 사용자 질의를 벡터로 변환
        query_vector = await self.embeddings.aembed_query(query)
        
        es_query = {
            "size": 5,
            "_source": ["recipes_id", 
                        "title", 
                        "main_image_url", 
                        "cook_time", 
                        "servings", 
                        "calories", 
                        "tags", 
                        "description"],
            "knn": {
                "field": "embedding",
                "query_vector": query_vector, # Langchain이 생성한 벡터
                "k": 10, # 의미적으로 가장 가까운 문서 상위 10개를 후보로 선택
                "num_candidates": 100, # 정확도를 몇개를 탐색할지
                # 벡터 유사도 계산 전에 특정 카테고리에 속한 문서만 대상으로 제한 (terms: 카테고리 중 하나라도 포함되면 OK)
                "filter": { "terms": { "category_name": categories } } if categories else None # 카테고리 없으면 전체를 바탕으로 검색 됨
            }
        }
        
        try:
            response = await es_client.client.search(index="michelin_recipes", body=es_query)
            hits = response['hits']['hits']
        except Exception as e:
            print(f"ES Search Error: {e}")
            return [], "", 0.0

        recipes, context_text = [], ""
        max_score = 0.0 # 가장 높은 유사도 점수 저장

        if hits:
            max_score = hits[0]['_score'] # 1등의 점수 (보통 0.7~0.8 이상이면 관련성 높음)
            
            for hit in hits:
                src = hit['_source']
                card = RecipeInfo(**{k: v for k, v in src.items() if k in RecipeInfo.__fields__})
                recipes.append(card)
                context_text += f"- {card.title}: {src.get('description')} (태그: {', '.join(card.tags)})\n"
                
        return recipes, context_text, max_score

    # Multi-turn RAG 실행
    async def run_rag(self, user_id: int, query: str, user_favorite_categories: List[str]):
        history = get_session_history(str(user_id)) # 사용자 히스토리 불러오기
        
        # 1. 검색 수행 (유사도 점수까지 불러오기)
        recipes, context_text, max_score = await self.search_es(query, user_favorite_categories)
        
        # 2. 상황별 시스템 프롬프트 분기
        # 임계값(0.75)은 테스트하면서 조절 필요. -> 튜닝 시기에 시도
        # 점수가 낮으면 -> 연결 멘트 유도
        if not recipes:
            # 아예 검색 결과가 없으면
            sys_prompt = (
                "너는 '미슐랭 0스타'의 셰프야. "
                "사용자 질문이 요리와 관련 없으면 재치 있는 농담으로 받아치고, "
                "레시피 추천을 원하면 구체적으로 물어봐달라고 해."
            )
        elif max_score < 0.7:
            # [Case: 관련도 낮은 질문] "오늘 날씨 어때?"
            sys_prompt = (
                "너는 '미슐랭 0스타'서비스의 친절한 셰프 AI야. "
                "사용자의 질문이 요리법과 음식에 직접 관련이 없더라도(예: 날씨, 기분 등), "
                "아래 [제공된 레시피]를 활용해서 자연스럽게 연결해줘. "
                "예를 들어 날씨에 대한 이야기를 했다면 '날씨는 제가 잘 모르지만, 이런 쌀쌀한 날엔 뜨끈한 이 요리가 어떠세요?' 같은 식으로 말해."
            )
        else:
            # [Case: 요리 질문] "매운거 추천해줘"
            sys_prompt = (
                "너는 '미슐랭 0스타'의 친절한 셰프 AI야. "
                "아래 [제공된 레시피] 5개를 사용자에게 추천할거야. "
                "이 레시피를 추천한 이유를 1-2문장으로 간단하게 레시피의 설명을 활용해서 간단히 설명해줘. 예를 들어 '추운 날씨에는 이런 음식들은 어떠세요?"
            )

        # 3. LLM에게 보낼 메시지 구성
        input_text = f"문맥(검색된 레시피):\n{context_text}\n\n사용자 질문: {query}"
        messages = [SystemMessage(content=sys_prompt)] + history.messages + [HumanMessage(content=input_text)]
                    # systemmessage: 역할과 행동 지침 / history.messages: 이전 대화 포함, Multi-turn / HumanMessage: 현재 질문 + 검색 결과 문맥
        # 4. 답변 생성
        response = await self.llm.ainvoke(messages) # async 방식으로 답변 생성
        answer = response.content # 최종 챗봇 텍스트
        
        # 5. 기억 저장
        history.add_user_message(query)
        history.add_ai_message(answer)
        
        return answer, recipes

    # [AI-5] Context-aware Q&A 실행
    async def run_qna(self, query: str, recipe_all_steps: List[StepDetail], current_step: int, chat_history: List[ChatMessage]):
        # 1. 레시피 단계를 텍스트로 가공
        steps_context = "\n".join([f"Step {s.step_number}: {s.description}" for s in recipe_all_steps])
        
        # 2. 과거 내역 가공
        formatted_history = []
        for msg in chat_history:
            if msg.sender_type == "user":
                formatted_history.append(HumanMessage(content=msg.content))
            else:
                formatted_history.append(AIMessage(content=msg.content))

        sys_prompt = f"""
        너는 셰프 도우미야. 아래 레시피 단계를 참고해줘:
        {steps_context}
        
        사용자는 현재 [{current_step}단계]를 진행 중이야. 대화 흐름을 보고 질문에 답해줘.
        """
        messages = [SystemMessage(content=sys_prompt)] + formatted_history + [HumanMessage(content=query)]
        response = await self.llm.ainvoke(messages)
        return response.content, []

rag_service = RagService()