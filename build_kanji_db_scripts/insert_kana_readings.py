import json
import psycopg2
from psycopg2.extras import execute_values
import os
import sys
from dotenv import load_dotenv

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

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

def insert_kana_readings(kana_readings_path: str):
    if not os.path.isfile(kana_readings_path) or not kana_readings_path.endswith(".json"):
        print(f"{RED}Kana readings json file not found: {kana_readings_path}")
        return

    with open(kana_readings_path, encoding="utf-8") as file:
        kana_unicode_reading = json.load(file)

    load_dotenv()
    connection = get_connection()

    try:
        with connection:
            with connection.cursor() as cursor:
                rows = [(reading, unicode) for unicode, reading in kana_unicode_reading.items()]
                execute_values(cursor, """
                    UPDATE japanese.kana
                    SET reading = data.reading
                    FROM (VALUES %s) AS data(reading, unicode)
                    WHERE japanese.kana.unicode = data.unicode
                """, rows)
                print(f"{GREEN}Updated {len(rows)} kana readings")
    except Exception as e:
        print(f"{RED}Error: {e}")
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        kana_readings_path = sys.argv[1]
    except IndexError:
        kana_readings_path = input(f"{YELLOW}kana_readings_path=") or "./kanji_source_files/kana_readings.json"
    
    insert_kana_readings(kana_readings_path=kana_readings_path)
