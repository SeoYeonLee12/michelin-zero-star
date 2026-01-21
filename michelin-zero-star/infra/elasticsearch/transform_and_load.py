import json
import os
import time
import requests
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk


# 환경 변수
ES_HOST = os.getenv('ELASTICSEARCH_HOST', 'localhost')
ES_PORT = os.getenv('ELASTICSEARCH_PORT', '9200')
ES_URL = f"http://{ES_HOST}:{ES_PORT}"

GMS_KEY = os.getenv("GMS_KEY")
GMS_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings"

print(f"Elasticsearch 연결 대기 중... ({ES_HOST}:{ES_PORT})")

# 연결 재시도 로직
max_retries = 60
retry_interval = 2
es = None
# es = Elasticsearch(f"http://{ES_HOST}:{ES_PORT}")

# for i in range(max_retries):
#     try:
#         es = Elasticsearch(
#             [f'http://{ES_HOST}:{ES_PORT}'],
#             request_timeout=30,
#             max_retries=5,
#             retry_on_timeout=True
#         )
#         info = es.info()
#         print(f"Elasticsearch 연결 성공! (버전: {info['version']['number']})")
#         break
#     except Exception as e:
#         print(f"연결 시도 {i+1}/{max_retries}... 대기 중")
#         time.sleep(retry_interval)
# else:
#     print("Elasticsearch 연결 실패 - 시간 초과")
#     exit(1)
for i in range(max_retries):
    try:
        es = Elasticsearch(
            ES_URL,
            request_timeout=30
        )

        info = es.info()
        print(f"Elasticsearch 연결 성공! (버전: {info['version']['number']})")
        break

    except Exception as e:
        print(f"연결 시도 {i+1}/{max_retries} 실패: {e}")
        time.sleep(retry_interval)

else:
    print("Elasticsearch 연결 실패 - 시간 초과")
    exit(1)


# JSON 파일 읽기
json_file = os.path.join(os.path.dirname(__file__), 'merged_recipes_final.json')
print(f"\nJSON 파일 읽는 중... ({json_file})")

with open(json_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 카테고리 매핑
CATEGORY_MAPPING = {
    "밥": 1,
    "반찬": 2,
    "국물": 3,
    "면": 4,
    "디저트": 5,
    "분식": 6,
    "샐러드": 7,
    "음료": 8,
    "기타": 9,
    "야식&술안주": 10
}

# 헬퍼 함수
def parse_time(time_str):
    """조리시간 파싱: '20분' → 20"""
    if not time_str:
        return 0
    try:
        return int(''.join(filter(str.isdigit, str(time_str))))
    except:
        return 0

def parse_servings(servings_str):
    """인분 파싱: '2인분' → 2"""
    if not servings_str:
        return 1
    try:
        return int(''.join(filter(str.isdigit, str(servings_str))))
    except:
        return 1

def parse_calories(cal_str):
    """칼로리 파싱: '350.5' → 350.5"""
    if not cal_str:
        return 0.0
    try:
        return float(str(cal_str).replace(',', ''))
    except:
        return 0.0

def clean_tags(tags):
    """태그 정제: ['#다이어트', '', '#저탄고지'] → ['다이어트', '저탄고지']"""
    if not tags:
        return []
    cleaned = []
    for tag in tags:
        if tag and isinstance(tag, str):
            clean_tag = tag.strip().lstrip('#').strip()
            if clean_tag:
                cleaned.append(clean_tag)
    return cleaned

def extract_ingredients(ingredients_list):
    """재료 추출: [{"name": "콜리플라워", "amount": "200g"}] → ['콜리플라워', '양파']"""
    if not ingredients_list:
        return []
    
    result = []
    for ing in ingredients_list:
        if isinstance(ing, dict):
            name = ing.get("name", "").strip()
            if name:
                result.append(name)
        elif isinstance(ing, str):
            result.append(ing.strip())
    return result

def create_full_text(recipe, category_name):
    """임베딩용 통합 텍스트 생성"""
    parts = []
    
    # 제목
    title = recipe.get("title", "")
    if title:
        parts.append(f"요리명: {title}")
    
    # 카테고리
    parts.append(f"카테고리: {category_name}")
    
    # 태그
    tags = clean_tags(recipe.get("tags", []))
    if tags:
        parts.append(f"태그: {' '.join(tags)}")
    
    # 조리시간
    # cook_time = recipe.get("cook_time", "")
    cook_time = parse_time(recipe.get("cook_time"))
    if cook_time:
        parts.append(f"조리시간: {cook_time}분")
    
    # 칼로리
    # calories = recipe.get("calories", "")
    calories = parse_calories(recipe.get("calories"))
    if calories:
        parts.append(f"칼로리: {calories}kcal")
    
    # 재료
    ingredients = extract_ingredients(recipe.get("ingredients", []))
    if ingredients:
        parts.append(f"재료: {', '.join(ingredients[:20])}")  # 최대 20개
    
    # 설명
    description = recipe.get("description", "")
    if description:
        # 너무 길면 400자로 제한
        desc_short = description[:400] + "..." if len(description) > 400 else description
        parts.append(f"설명: {desc_short}")

    # 인분
    servings = parse_servings(recipe.get("servings"))
    if servings:
        parts.append(f"인분: {servings}인분")

    return ". ".join(parts)

# 데이터 변환
# all_documents = []
# recipes_id = 1

# print("\n데이터 변환 중...")

# for category_name, recipe_list in data.items():
#     categories_id = CATEGORY_MAPPING.get(category_name, 9)
#     print(f"카테고리 '{category_name}' (ID: {categories_id}): {len(recipe_list)}개")
    
#     for recipe in recipe_list:
#         doc = {
#             "recipes_id": recipes_id,
#             "categories_id": categories_id,
#             "category_name": category_name,
#             "title": recipe.get("title", ""),
#             "main_image_url": recipe.get("main_image", ""),
#             "description": recipe.get("description", ""),
#             "cook_time": parse_time(recipe.get("cook_time")),
#             "servings": parse_servings(recipe.get("servings")),
#             "calories": parse_calories(recipe.get("calories")),
#             "tags": clean_tags(recipe.get("tags", [])),
#             "ingredients": extract_ingredients(recipe.get("ingredients", [])),
#             "embedding": recipe.get("embedding", []),  # 없으면 빈 배열
#             "full_text": create_full_text(recipe, category_name)
#         }
        
#         all_documents.append(doc)
#         recipes_id += 1

# print(f"\n총 {len(all_documents)}개의 문서 생성 완료")


# GMS 임베딩 호출
def embed_batch(texts):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GMS_KEY}"
    }

    payload = {
        "model": "text-embedding-3-large",
        "input": texts
    }

    r = requests.post(GMS_URL, headers=headers, json=payload, timeout=60)

    if r.status_code != 200:
        print("❌ GMS 임베딩 API 실패")
        print("Status:", r.status_code)
        print("Body:", r.text)
        raise RuntimeError("GMS Embedding API Error")

    data = r.json()
    return [d["embedding"] for d in data["data"]]


# Bulk Generator
BATCH_SIZE = 15
SLEEP_SEC  = 1.2

# # Bulk Insert
# def generate_actions():
#     recipes_id = 1

#     for category_name, recipe_list in data.items():
#         categories_id = CATEGORY_MAPPING.get(category_name, 9)
#         print(f"카테고리 '{category_name}' (ID: {categories_id}): {len(recipe_list)}개")

#         for recipe in recipe_list:
#             doc = {
#                 "recipes_id": recipes_id,
#                 "categories_id": categories_id,
#                 "category_name": category_name,
#                 "title": recipe.get("title", ""),
#                 "main_image_url": recipe.get("main_image", ""),
#                 "description": recipe.get("description", ""),
#                 "cook_time": parse_time(recipe.get("cook_time")),
#                 "servings": parse_servings(recipe.get("servings")),
#                 "calories": parse_calories(recipe.get("calories")),
#                 "tags": clean_tags(recipe.get("tags", [])),
#                 "ingredients": extract_ingredients(recipe.get("ingredients", [])),
#                 # "embedding": recipe.get("embedding", []),
#                 "full_text": create_full_text(recipe, category_name)
#             }

#             yield {
#                 "_index": "michelin_recipes",
#                 "_id": recipes_id,
#                 "_source": doc
#             }

#             recipes_id += 1


# Bulk Insert
def generate_actions():
    recipes_id = 1
    batch_texts = []
    batch_meta  = []

    for category_name, recipe_list in data.items():
        categories_id = CATEGORY_MAPPING.get(category_name, 9)
        print(f"카테고리 '{category_name}' (ID: {categories_id}): {len(recipe_list)}개")

        for recipe in recipe_list:
            full_text = create_full_text(recipe, category_name)

            batch_texts.append(full_text)
            batch_meta.append((recipes_id, category_name, categories_id, recipe, full_text))

            if len(batch_texts) == BATCH_SIZE:
                embeddings = embed_batch(batch_texts)

                for emb, meta in zip(embeddings, batch_meta):
                    rid, cname, cid, recipe, ft = meta

                    yield {
                        "_index": "michelin_recipes",
                        "_id": rid,
                        "_source": {
                            "recipes_id": rid,
                            "categories_id": cid,
                            "category_name": cname,
                            "title": recipe.get("title", ""),
                            "main_image_url": recipe.get("main_image", ""),
                            "description": recipe.get("description", ""),
                            "cook_time": parse_time(recipe.get("cook_time")),
                            "servings": parse_servings(recipe.get("servings")),
                            "calories": parse_calories(recipe.get("calories")),
                            "tags": clean_tags(recipe.get("tags")),
                            "ingredients": extract_ingredients(recipe.get("ingredients", [])),
                            "full_text": ft,
                            "embedding": emb
                        }
                    }
            
                batch_texts.clear()
                batch_meta.clear()
                time.sleep(SLEEP_SEC)

            recipes_id += 1

    if batch_texts:
        print(f"[마지막 배치] {len(batch_texts)}개 처리 중")

        embeddings = embed_batch(batch_texts) or [ [] ] * len(batch_texts)

        for emb, meta in zip(embeddings, batch_meta):
            rid, cname, cid, recipe, ft = meta

            yield {
                "_index": "michelin_recipes",
                "_id": rid,
                "_source": {
                    "recipes_id": rid,
                    "categories_id": cid,
                    "category_name": cname,
                    "title": recipe.get("title", ""),
                    "main_image_url": recipe.get("main_image", ""),
                    "description": recipe.get("description", ""),
                    "cook_time": parse_time(recipe.get("cook_time")),
                    "servings": parse_servings(recipe.get("servings")),
                    "calories": parse_calories(recipe.get("calories")),
                    "tags": clean_tags(recipe.get("tags")),
                    "ingredients": extract_ingredients(recipe.get("ingredients", [])),
                    "full_text": ft,
                    "embedding": emb
                }
            }

        batch_texts.clear()
        batch_meta.clear()
            
print("\nElasticsearch에 데이터 적재 중...")

try:
    success, failed = bulk(es, generate_actions(), raise_on_error=False, chunk_size=25)
    
    print(f"\n=== 적재 결과 ===")
    print(f"성공: {success}개")
    print(f"실패: {len(failed)}개")
    
    # if failed:
    #     print(f"\n실패 예시 (처음 3개):")
    #     for i, error in enumerate(failed[:3]):
    #         print(f"\n{i+1}. {error}")
    
    # # 최종 확인
    # count = es.count(index="michelin_recipes")
    # print(f"\n최종 인덱스 문서 수: {count['count']}개")
    
    # if count['count'] == len(all_documents):
    #     print("모든 레시피가 성공적으로 적재되었습니다")
    # else:
    #     print(f"예상({len(all_documents)})과 실제({count['count']}) 문서 수가 다릅니다.")
        
except Exception as e:
    print(f"데이터 적재 실패: {e}")
    import traceback
    traceback.print_exc()
    exit(1)