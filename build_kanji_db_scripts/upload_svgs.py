import os
import sys
from supabase import create_client
from dotenv import load_dotenv

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def upload_folder(supabase, folder_path: str, bucket: str, subfolder: str):
    files = [f for f in os.listdir(folder_path) if f.endswith(".svg")]
    total = len(files)
    count = 0

    for index, filename in enumerate(files, start=1):
        if index % 100 == 0 or index == total:
            print(f"\r{YELLOW}Uploading to {subfolder}: {index}/{total}...", end="", flush=True)
        with open(os.path.join(folder_path, filename), "rb") as f:
            supabase.storage.from_(bucket).upload(f"{subfolder}/{filename}", f, {"content-type": "image/svg+xml"})
            count += 1

    print()
    print(f"{GREEN}Done: {count} SVGs uploaded to '{bucket}/{subfolder}'")
    return count

def upload_svgs_to_supabase(filtered_folder: str, bucket:str):
    if not os.path.isdir(filtered_folder):
        print(f"{RED}Filtered folder not found: {filtered_folder}")
        return
    
    kanji_folder = os.path.join(filtered_folder, "kanji")
    kana_folder = os.path.join(filtered_folder, "kana")

    if not os.path.isdir(kanji_folder):
        print(f"{RED}Kanji folder not found: {kanji_folder}")
        return
    if not os.path.isdir(kana_folder):
        print(f"{RED}Kana folder not found: {kana_folder}")
        return

    load_dotenv()

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url or not key:
        print(f"{RED}Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
        return

    supabase = create_client(url, key)

    upload_folder(supabase, kanji_folder, bucket, "kanji")
    upload_folder(supabase, kana_folder, bucket, "kana")

if __name__ == "__main__":
    try:
        filtered_folder = sys.argv[1]
    except IndexError:
        filtered_folder = input(f"{YELLOW}filtered_folder=") or "./kanji_source_files/filtered"
    
    try:
        bucket = sys.argv[2]
    except IndexError:
        bucket = input(f"{YELLOW}bucket=") or "japanese-characters"

    upload_svgs_to_supabase(filtered_folder=filtered_folder, bucket=bucket)
    