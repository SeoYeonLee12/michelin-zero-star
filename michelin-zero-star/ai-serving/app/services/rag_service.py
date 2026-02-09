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
# 세션별 대화 이력 관리
# --------------------------------------------------
session_store = {}

def get_session_history(session_id: str) -> ChatMessageHistory:
    if session_id not in session_store:
        session_store[session_id] = ChatMessageHistory()
    return session_store[session_id]

class RagService:
    def __init__(self):
        # SSAFY GMS(OpenAI Proxy) 설정
        gms_base_url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"
        
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large",
            openai_api_key=settings.OPENAI_API_KEY,
            base_url=gms_base_url
        )
        
        self.llm = ChatOpenAI(
            model="gpt-4o-mini", 
            temperature=0.7,
            openai_api_key=settings.OPENAI_API_KEY,
            base_url=gms_base_url
        )

    # RAG: 하이브리드 검색
    async def search_es(self, query: str, categories: List[str]) -> Tuple[List[RecipeInfo], str, float]:
        query_vector = await self.embeddings.aembed_query(query)
        
        knn_params = {
            "field": "embedding",
            "query_vector": query_vector,
            "k": 10,
            "num_candidates": 100,
        }

        if categories:
            knn_params["filter"] = { "terms": { "category_name": categories } }

        es_query = {
            "size": 5, # [설정] 최대 5개까지 후보를 가져옴
            "_source": ["recipes_id", "title", "main_image_url", "cook_time", 
                        "servings", "calories", "tags", "description"],
            "knn": knn_params 
        }
        
        try:
            response = await es_client.client.search(index="michelin_recipes", body=es_query)
            hits = response['hits']['hits']
            # 유사도 점수 기준 내림차순 정렬
            hits = sorted(hits, key=lambda x: x['_score'], reverse=True)
            
            # ✅ [수정] 가장 높은 점수(1등) 1개 제외
            if hits:
                hits = hits[1:] 

        except Exception as e:
            print(f"ES Search Error: {e}")
            return [], "", 0.0

        recipes, context_text = [], ""
        max_score = 0.0 

        # [수정] 개별 아이템 필터링을 위한 임계값 (0.6)
        MIN_ITEM_SCORE = 0.6 

        if hits:
            max_score = hits[0]['_score'] # 전체 쿼리의 대표 점수 (원래 2등이었던 친구가 1등이 됨)
            
            for hit in hits:
                score = hit['_score']
                
                # [수정] 퀄리티 컨트롤: 점수가 0.6 미만이면 리스트에 넣지 않고 건너뜀
                if score < MIN_ITEM_SCORE:
                    continue

                src = hit['_source']
                # Pydantic 모델로 변환
                card = RecipeInfo(**{k: v for k, v in src.items() if k in RecipeInfo.__fields__})
                recipes.append(card)
                context_text += f"- {card.title}: {src.get('description')} (태그: {', '.join(card.tags)})\n"
                
        return recipes, context_text, max_score

    # Multi-turn RAG 실행
    async def run_rag(self, user_id: int, query: str, user_favorite_categories: List[str]):
        history = get_session_history(str(user_id))
        
        # 1. 검색 수행
        recipes, context_text, max_score = await self.search_es(query, user_favorite_categories)
        
        # [설정] 질문 유효성 판단 임계값 (0.7)
        THRESHOLD_SCORE = 0.7 
        
        # 2. 시스템 프롬프트 분기
        if not recipes:
            # 검색 결과 없음 (혹은 1등 지웠더니 남은게 없거나, 남은게 점수 미달인 경우)
            sys_prompt = (
                "너는 '미슐랭 0스타'의 셰프야. "
                "사용자 질문에 맞는 레시피를 냉장고(DB)에서 찾을 수 없어. "
                "정중하게 '죄송하지만 찾으시는 메뉴가 없네요'라고 말하고, 다른 메뉴를 물어봐달라고 해. "
                "답변할 때 불필요한 마크다운 서식(볼드, 헤더 등)은 사용하지 말고 텍스트로만 담백하게 작성해."
            )
        elif max_score < THRESHOLD_SCORE: 
            # 관련도 낮음 (2등의 점수가 0.7 미만인 경우)
            recipes = [] 
            context_text = "" 

            sys_prompt = (
                "너는 '미슐랭 0스타'서비스의 친절한 셰프 AI야. "
                "사용자의 질문이 요리와 관련이 낮거나 잡담인 것 같아. "
                "이럴 땐 억지로 레시피를 추천하지 말고, 셰프의 페르소나를 유지하면서 재치있게 대답해줘. "
                "자연스럽게 요리나 음식 주제로 대화를 유도하면 더 좋아. "
                "답변은 과도한 마크다운(볼드체 등) 없이 텍스트 위주로 깔끔하게 해줘. 그리고 우리 db에 있는 레시피를 추천해야하므로 니가 임의로 레시피를 생각해서 답변은 하지마."
            )
        else:
            # [Case: 정상 추천]
            sys_prompt = (
                "너는 '미슐랭 0스타'의 친절한 셰프 AI야. "
                "아래 [제공된 레시피]들을 사용자에게 추천할거야. "
                "개별 레시피를 나열하며 설명하지 말고, **사용자의 질문과 추천된 메뉴들 전체를 관통하는 이유를 1~2문장으로 자연스럽게 설명해줘.** "
                "예를 들어 사용자가 '매운 음식'을 찾았는데 '참깨 다식'같은 디저트가 추천된다면, '매운 음식을 드신 후에 입가심하기 좋은 달콤한 디저트도 함께 준비해봤어요.'처럼 흐름을 만들어줘. "
                "**중요:** 답변에 불필요한 마크다운(## 헤더, **볼드** 등)을 사용하지 마. 텍스트 위주로 깔끔하게 작성해."
            )

        # 3. 메시지 구성
        input_text = f"문맥(검색된 레시피):\n{context_text}\n\n사용자 질문: {query}"
        messages = [SystemMessage(content=sys_prompt)] + history.messages + [HumanMessage(content=input_text)]
        
        # 4. 답변 생성
        response = await self.llm.ainvoke(messages)
        answer = response.content
        
        # 5. 기억 저장
        history.add_user_message(query)
        history.add_ai_message(answer)
        
        return answer, recipes

    # Context-aware Q&A 실행
    async def run_qna(self, query: str, recipe_all_steps: List[StepDetail], current_step: int, chat_history: List[ChatMessage]):
        steps_context = "\n".join([f"Step {s.step_number}: {s.description}" for s in recipe_all_steps])
        
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
        답변 시 불필요한 마크다운 서식은 피하고 텍스트로 깔끔하게 설명해줘.
        """
        messages = [SystemMessage(content=sys_prompt)] + formatted_history + [HumanMessage(content=query)]
        response = await self.llm.ainvoke(messages)
        return response.content, []

rag_service = RagService()
