import json
import psycopg2
from psycopg2.extras import execute_values
import os
import sys
from dotenv import load_dotenv

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

load_dotenv()

def get_connection():
    connection = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require"
    )
    return connection

def insert_kana(cursor, kana_db: dict):
    total = len(kana_db)
    rows = []
    for index, (unicode, data) in enumerate(kana_db.items(), start=1):
        if index % 100 == 0 or index == total:
            print(f"\r{YELLOW}Preparing kana: {index}/{total}...", end="", flush=True)
        rows.append((
            data["unicode"],
            data["literal"],
            data["type"],
            data["stroke_count"],
            json.dumps(data["strokes"])
        ))
    execute_values(cursor, """
        INSERT INTO japanese.kana (unicode, literal, type, stroke_count, strokes)
        VALUES %s
        ON CONFLICT (unicode) DO NOTHING
    """, rows)
    print()

def insert_kanji(cursor, kanji_db: dict):
    total = len(kanji_db)

    # Collect unique jlpt, grade, languages, reading_types
    jlpt_levels = set()
    grade_levels = set()
    languages = set()
    reading_types = set()

    for data in kanji_db.values():
        if data.get("jlpt_level"):
            jlpt_levels.add(data["jlpt_level"])
        if data.get("grade"):
            grade_levels.add(data["grade"])
        for lang in data.get("meanings", {}).keys():
            languages.add(lang)
        for rtype in data.get("readings", {}).keys():
            reading_types.add(rtype)

    # Insert lookup tables
    execute_values(cursor, "INSERT INTO japanese.jlpt (level) VALUES %s ON CONFLICT DO NOTHING", [(l,) for l in jlpt_levels])
    execute_values(cursor, "INSERT INTO japanese.grade (level) VALUES %s ON CONFLICT DO NOTHING", [(l,) for l in grade_levels])
    execute_values(cursor, "INSERT INTO japanese.language (code) VALUES %s ON CONFLICT DO NOTHING", [(l,) for l in languages])
    execute_values(cursor, "INSERT INTO japanese.reading_type (name) VALUES %s ON CONFLICT DO NOTHING", [(r,) for r in reading_types])

    # Fetch reading_type ids
    cursor.execute("SELECT id, name FROM japanese.reading_type")
    reading_type_map = {name: id for id, name in cursor.fetchall()}

    # Prepare kanji rows
    kanji_rows = []
    reading_rows = []
    meaning_rows = []
    nanori_rows = []

    for index, (unicode, data) in enumerate(kanji_db.items(), start=1):
        if index % 100 == 0 or index == total:
            print(f"\r{YELLOW}Preparing kanji: {index}/{total}...", end="", flush=True)

        kanji_rows.append((
            data["unicode"],
            data["literal"],
            data["stroke_count"],
            data.get("radical_name"),
            data.get("frequency_of_use"),
            json.dumps(data["strokes"]),
            data.get("jlpt_level"),
            data.get("grade")
        ))

        for rtype, values in data.get("readings", {}).items():
            for value in values:
                reading_rows.append((unicode, reading_type_map[rtype], value))

        for lang, values in data.get("meanings", {}).items():
            for value in values:
                meaning_rows.append((unicode, lang, value))

        for value in data.get("nanori", []):
            nanori_rows.append((unicode, value))

    print()

    # Batch inserts
    print(f"{YELLOW}Inserting kanji...", flush=True)
    execute_values(cursor, """
        INSERT INTO japanese.kanji (unicode, literal, stroke_count, radical_name, frequency_of_use, strokes, jlpt_level, grade_level)
        VALUES %s
        ON CONFLICT (unicode) DO NOTHING
    """, kanji_rows)

    print(f"{YELLOW}Inserting readings...", flush=True)
    execute_values(cursor, """
        INSERT INTO japanese.kanji_reading (unicode, reading_type_id, value)
        VALUES %s
    """, reading_rows)

    print(f"{YELLOW}Inserting meanings...", flush=True)
    execute_values(cursor, """
        INSERT INTO japanese.kanji_meaning (unicode, language, value)
        VALUES %s
    """, meaning_rows)

    print(f"{YELLOW}Inserting nanori...", flush=True)
    execute_values(cursor, """
        INSERT INTO japanese.kanji_nanori (unicode, value)
        VALUES %s
    """, nanori_rows)

def insert_db(kanji_db_path: str, kana_db_path: str):
    with open(kanji_db_path, encoding="utf-8") as file:
        kanji_db = json.load(file)

    with open(kana_db_path, encoding="utf-8") as file:
        kana_db = json.load(file)

    connection = get_connection()

    try:
        with connection:
            with connection.cursor() as cursor:
                insert_kana(cursor, kana_db)
                insert_kanji(cursor, kanji_db)
        print(f"{GREEN}Done: {len(kanji_db)} kanji, {len(kana_db)} kana inserted")
    except Exception as e:
        print(f"{RED}Error: {e}")
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        kanji_db_path = sys.argv[1]
    except IndexError:
        kanji_db_path = input(f"{YELLOW}kanji_db_path=") or "kanji_db.json"

    try:
        kana_db_path = sys.argv[2]
    except IndexError:
        kana_db_path = input(f"{YELLOW}kana_db_path=") or "kana_db.json"

    insert_db(kanji_db_path, kana_db_path)