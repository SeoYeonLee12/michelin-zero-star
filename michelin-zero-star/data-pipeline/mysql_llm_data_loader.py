import os
import re
import json
import pymysql
import requests
from dotenv import load_dotenv

load_dotenv()

# =========================
# 환경 변수
# =========================
DB_HOST = os.getenv("PROD_DB_HOST")
DB_PORT = int(os.getenv("PROD_DB_PORT", 3306))
DB_NAME = os.getenv("PROD_DB_NAME")
DB_USER = os.getenv("PROD_DB_USER")
DB_PASSWORD = os.getenv("PROD_DB_PASSWORD")

GMS_API_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions"
GMS_KEY = os.getenv("GMS_KEY")

# BOT_USER_ID = 1
RECIPE_TYPE = "CHEF"

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


# =========================
# 유틸: "15분" → 15
# =========================
def parse_minutes(text):
    if not text:
        return 0
    if isinstance(text, int): 
        return text
    return int("".join([c for c in text if c.isdigit()]) or 0)


def safe_float(val):
    try:
        return float(val) if val is not None else 0.0
    except:
        return 0.0


# =========================
# LLM 단계 타이머 생성
# =========================
def generate_step_timers(title, total_minutes, steps):
    prompt = f"""
너는 요리 전문가야.

아래 레시피의 각 조리 단계를 보고,
각 단계에 대략 몇 초가 걸릴지 추정해줘.

규칙:
- 전체 합은 가능한 한 전체 조리시간과 비슷하게 맞출 것 (모든 단계의 합이 전체 시간({total_minutes}분 = {total_minutes * 60}초)과 비슷해야 해.)
- 단순 준비 단계는 30~90초
- 굽기, 끓이기, 조림 등은 수 분 이상 가능
- 결과는 반드시 [초, 초, 초] 형태의 JSON 숫자 배열만 출력해. (예: [30, 120, 60])
- 텍스트 설명 없이 오직 JSON 배열만 보내.

레시피 제목: {title}
전체 조리시간(분): {total_minutes}

조리 단계:
""" + "\n".join([f"{i+1}. {s}" for i, s in enumerate(steps)])

    try:
        res = requests.post(
            GMS_API_URL,
            headers={
                "Authorization": f"Bearer {GMS_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant that only outputs JSON arrays of numbers."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0
            },
            timeout=60
        )
        res.raise_for_status()
        content = res.json()["choices"][0]["message"]["content"].strip()

        # 마크다운 태그 제거 (```json [ ... ] ``` 추출)
        if content.startswith("```"):
            content = re.sub(r"```(?:json)?\n?|```", "", content).strip()

        try:
            timers = json.loads(content)
        except json.JSONDecodeError:
            # 여전히 실패 시 대괄호만 추출 시도
            match = re.search(r"\[.*\]", content, re.DOTALL)
            if match:
                timers = json.loads(match.group())
            else:
                raise ValueError("JSON 형식을 찾을 수 없음")
            
        timers = json.loads(content)

        if len(timers) != len(steps):
            raise ValueError("LLM step 수 불일치")

        return timers
    except Exception as e:
        print(f"⚠️ LLM 실패 → 평균값 대체: {e}")
        avg = int((total_minutes * 60) / len(steps)) if total_minutes and steps else 60
        return [avg] * len(steps)


# =========================
# MySQL 연결
# =========================
def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )

# ###################
# def ensure_users_table(cursor):
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS users (
#             id BIGINT AUTO_INCREMENT PRIMARY KEY,
#             email VARCHAR(255) UNIQUE,
#             nickname VARCHAR(255),
#             role VARCHAR(50),
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#         )
#     """)
# ###################


def get_bot_user_id(cursor):
    cursor.execute(
        "SELECT users_id FROM users WHERE email = %s",
        ("crawling_bot@michelin0.com",)
    )
    row = cursor.fetchone()
    if not row:
        raise RuntimeError("❌ 크롤링 봇 계정이 DB에 없음. 먼저 봇 계정을 생성하세요.")
    return row["users_id"]




# =========================
# ERD 맞춤 Insert 함수들
# =========================
def insert_recipe(cursor, r, bot_user_id):
    """recipes 테이블 삽입"""
    prep_min = parse_minutes(r.get("prep_time"))
    cook_min = parse_minutes(r.get("cook_time"))
    total_cook_time = prep_min + cook_min

    nutrition = r.get("nutrition", {})

    cursor.execute("""
        INSERT INTO recipes
        (users_id, title, main_image_url, description, cook_time, servings,
         recipe_type, calories, carbohydrate, protein, saturated_fat,
         cholesterol, sodium, calcium, created_at, updated_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
    """, (
        bot_user_id,
        # r["title"],
        r.get("title", "제목 없음"),
        r.get("main_image", ""),
        r.get("description", ""),
        total_cook_time,
        int("".join([c for c in r.get("servings", "1") if c.isdigit()]) or 1),
        RECIPE_TYPE,
        safe_float(nutrition.get("calories")),
        safe_float(nutrition.get("carbohydrate")),
        safe_float(nutrition.get("protein")),
        safe_float(nutrition.get("saturated_fat")),
        safe_float(nutrition.get("cholesterol")),
        safe_float(nutrition.get("sodium")),
        safe_float(nutrition.get("calcium")),
    ))

    return cursor.lastrowid

def insert_recipe_category(cursor, recipe_id, categories_id):
    """recipe_categories 테이블 삽입"""
    cursor.execute("""
                   INSERT INTO recipe_categories (recipes_id, categories_id, created_at, updated_at)
                   VALUES (%s, %s, NOW(), NOW())
    """, (recipe_id, categories_id))


def insert_ingredients(cursor, recipe_id, r):
    for ing in r.get("ingredients", []):
        if isinstance(ing, dict):
            cursor.execute("""
                INSERT INTO recipe_ingredients (recipe_id, name, amount, created_at, updated_at)
                VALUES (%s,%s,%s,NOW(),NOW())
            """, (recipe_id, ing.get("name", ""), ing.get("amount", "")))


def insert_steps(cursor, recipe_id, r):
    steps = r.get("steps", [])
    if not steps:
        return

    step_texts = [s.get("description", "") for s in steps]

    prep_min = parse_minutes(r.get("prep_time"))
    cook_min = parse_minutes(r.get("cook_time"))
    total_min = prep_min + cook_min

    # try:
    #     timers = generate_step_timers(r["title"], total_min, step_texts)
    # except Exception as e:
    #     print("⚠️ LLM 실패 → 평균값 대체:", e)
    #     avg = int((total_min * 60) / len(steps)) if total_min else 60
    #     timers = [avg] * len(steps)
    # LLM 호출
    timers = generate_step_timers(r.get("title", ""), total_min, step_texts)

    for idx, s in enumerate(steps, start=1):
        cursor.execute("""
            INSERT INTO recipe_steps
            (recipe_id, step_number, description, timer_seconds, media_url, tip, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,NOW(),NOW())
        """, (
            recipe_id,
            idx,
            s.get("description", ""),
            int(timers[idx - 1]),
            s.get("image", ""),   # ERD NOT NULL 대응
            s.get("tip")
        ))


def insert_tags(cursor, recipe_id, r):
    for t in r.get("tags", []):
        if t and isinstance(t, str):
            clean_tag = t.strip().lstrip('#').strip()
            if clean_tag:
                cursor.execute("""
                    INSERT INTO recipe_tags (recipe_id, tag_name, created_at, updated_at)
                    VALUES (%s,%s,NOW(),NOW())
                """, (recipe_id, clean_tag))


# def insert_categories(cursor, recipe_id, r):
#     for c in r.get("categories", []):
#         cursor.execute("""
#             INSERT INTO recipe_categories (recipes_id, categories_id)
#             VALUES (%s,%s)
#         """, (recipe_id, c))

# =========================
# 메인 로직
# =========================
def main():
    print("JSON 로딩 중...")
    try:
        with open("merged_recipes_final.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ JSON 파일을 찾을 수 없습니다.")
        return

    conn = get_connection()
    cursor = conn.cursor()

    # ensure_users_table(cursor) ###########

    try:
        BOT_USER_ID = get_bot_user_id(cursor)
        print(f"✅ 크롤링 봇 users_id = {BOT_USER_ID}")
    except RuntimeError as e:
        print(str(e))
        cursor.close()
        conn.close()
        return

    success = 0
    fail = 0


    # 카테고리별로 데이터 처리
    for category_name, recipe_list in data.items():
            categories_id = CATEGORY_MAPPING.get(category_name, 9)
            print(f"\n📂 카테고리 '{category_name}' (ID: {categories_id}): {len(recipe_list)}개")

            for r in recipe_list:
                try:
                    recipe_id = insert_recipe(cursor, r, BOT_USER_ID)
                    insert_recipe_category(cursor, recipe_id, categories_id)
                    insert_ingredients(cursor, recipe_id, r)
                    insert_steps(cursor, recipe_id, r)
                    insert_tags(cursor, recipe_id, r)

                    conn.commit()
                    success += 1
                    if success % 10 == 0:
                        print(f"  진행: {success}개 완료")

                except Exception as e:
                    conn.rollback()
                    fail += 1
                    print(f"❌ 실패: {r.get('title', 'Unknown')} → {e}")

    cursor.close()
    conn.close()

    print("\n====== 결과 ======")
    print(f"✅ 성공: {success}개")
    print(f"❌ 실패: {fail}개")



if __name__ == "__main__":
    main()
