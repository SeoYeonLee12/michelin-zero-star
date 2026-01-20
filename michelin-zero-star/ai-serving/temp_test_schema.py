# 테스트를 위한 임시 파일
from app.schemas.chat import ChatRequest, RecipeInfo, ChatResponse
import json

def test_schemas():
    print("=== [1] Request 모델 테스트 ===")
    try:
        # 프론트에서 이렇게 준다고 가정
        req_data = {
            "user_id": 101,
            "query": "매운거 추천해줘",
            "user_context": {"preference": "spicy"}
        }
        request = ChatRequest(**req_data)
        print("✅ ChatRequest 생성 성공:", request.model_dump())
    except Exception as e:
        print("❌ ChatRequest 실패:", e)

    print("\n=== [2] RecipeInfo (DTO) 테스트 ===")
    try:
        # ES에서 뽑은 데이터라고 가정
        recipe_data = {
            "recipes_id": 55,
            "title": "지옥의 마라탕",
            "main_image_url": "http://img.com/mara.jpg",
            "cook_time": 15,
            "servings": 2,          
            "calories": 500.5,
            "tags": ["#매움", "#야식"]
        }
        info = RecipeInfo(**recipe_data)
        print("✅ RecipeInfo 생성 성공:", info.title)
    except Exception as e:
        print("❌ RecipeInfo 실패:", e)

    print("\n=== [3] Response 모델 테스트 ===")
    try:
        res_data = {
            "answer": "마라탕 어떠세요?",
            "recommended_recipes": [recipe_data] # 위에서 만든 레시피 리스트
        }
        response = ChatResponse(**res_data)
        print("✅ ChatResponse 생성 성공!")
        # JSON으로 변환해보기 (실제 API 응답 형태)
        print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))
    except Exception as e:
        print("❌ ChatResponse 실패:", e)

if __name__ == "__main__":
    test_schemas()