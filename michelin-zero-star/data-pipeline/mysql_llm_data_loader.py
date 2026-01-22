import os
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


# =========================
# 유틸: "15분" → 15
# =========================
def parse_minutes(text):
    if not text:
        return 0
    return int("".join([c for c in text if c.isdigit()]) or 0)


def safe_float(val):
    try:
        return float(val)
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
- 전체 합은 가능한 한 전체 조리시간과 비슷하게 맞출 것
- 단순 준비 단계는 30~90초
- 굽기, 끓이기, 조림 등은 수 분 이상 가능
- 결과는 반드시 JSON 배열로만 출력

레시피 제목: {title}
전체 조리시간(분): {total_minutes}

조리 단계:
""" + "\n".join([f"{i+1}. {s}" for i, s in enumerate(steps)])

    res = requests.post(
        GMS_API_URL,
        headers={
            "Authorization": f"Bearer {GMS_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3
        },
        timeout=60
    )

    content = res.json()["choices"][0]["message"]["content"]
    timers = json.loads(content)

    if len(timers) != len(steps):
        raise ValueError("LLM step 수 불일치")

    return timers


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

def get_bot_user_id(cursor):
    cursor.execute(
        "SELECT users_id FROM users WHERE email = %s",
        ("crawling_bot@michelin0.com",)
    )
    row = cursor.fetchone()
    if not row:
        raise RuntimeError("❌ 크롤링 봇 계정이 DB에 없음")
    return row["users_id"]


# =========================
# 메인 로직
# =========================
def main():
    print("JSON 로딩 중...")
    with open("merged_recipes_final.json", "r", encoding="utf-8") as f:
        recipes = json.load(f)

    conn = get_connection()
    cursor = conn.cursor()

    BOT_USER_ID = get_bot_user_id(cursor)
    print(f"크롤링 봇 users_id = {BOT_USER_ID}")

    success = 0
    fail = 0

    for r in recipes:
        try:
            recipe_id = insert_recipe(cursor, r, BOT_USER_ID)
            insert_ingredients(cursor, recipe_id, r)
            insert_steps(cursor, recipe_id, r)
            insert_tags(cursor, recipe_id, r)
            # insert_categories(cursor, recipe_id, r)

            conn.commit()
            success += 1
            print(f"✅ 적재 성공: {r['title']}")

        except Exception as e:
            conn.rollback()
            fail += 1
            print(f"❌ 실패: {r.get('title')} → {e}")

    cursor.close()
    conn.close()

    print("====== 결과 ======")
    print("성공:", success)
    print("실패:", fail)


# =========================
# ERD 맞춤 Insert 함수들
# =========================
def insert_recipe(cursor, r, bot_user_id):
    prep_min = parse_minutes(r.get("prep_time"))
    cook_min = parse_minutes(r.get("cook_time"))
    total_cook_time = prep_min + cook_min

    nutrition = r.get("nutrition", {})

    cursor.execute("""
        INSERT INTO recipes
        (users_id, title, main_image_url, description, cook_time, servings,
         recipe_type, calories, carbohydrate, protein, saturated_fat,
         cholesterol, sodium, calcium)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        bot_user_id,
        r["title"],
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


def insert_ingredients(cursor, recipe_id, r):
    for ing in r.get("ingredients", []):
        cursor.execute("""
            INSERT INTO recipe_ingredients (recipe_id, name, amount)
            VALUES (%s,%s,%s)
        """, (recipe_id, ing["name"], ing["amount"]))


def insert_steps(cursor, recipe_id, r):
    steps = r.get("steps", [])
    if not steps:
        return

    step_texts = [s["description"] for s in steps]

    prep_min = parse_minutes(r.get("prep_time"))
    cook_min = parse_minutes(r.get("cook_time"))
    total_min = prep_min + cook_min

    try:
        timers = generate_step_timers(r["title"], total_min, step_texts)
    except Exception as e:
        print("⚠️ LLM 실패 → 평균값 대체:", e)
        avg = int((total_min * 60) / len(steps)) if total_min else 60
        timers = [avg] * len(steps)

    for idx, s in enumerate(steps, start=1):
        cursor.execute("""
            INSERT INTO recipe_steps
            (recipe_id, step_number, description, timer_seconds, media_url, tip)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            recipe_id,
            idx,
            s["description"],
            int(timers[idx - 1]),
            s.get("image", ""),   # ERD NOT NULL 대응
            None
        ))


def insert_tags(cursor, recipe_id, r):
    for t in r.get("tags", []):
        cursor.execute("""
            INSERT INTO recipe_tags (recipe_id, tag_name)
            VALUES (%s,%s)
        """, (recipe_id, t))


# def insert_categories(cursor, recipe_id, r):
#     for c in r.get("categories", []):
#         cursor.execute("""
#             INSERT INTO recipe_categories (recipes_id, categories_id)
#             VALUES (%s,%s)
#         """, (recipe_id, c))


if __name__ == "__main__":
    main()
