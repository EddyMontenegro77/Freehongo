import json
import os
import sys
import shutil

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def organize_svgs(svg_folder: str, kanji_db_path: str, kana_db_path: str, out_folder_path: str):
    if not os.path.isfile(kanji_db_path):
        print(f"{RED}Kanji DB file not found: {kanji_db_path}")
        return
    with open(kanji_db_path, encoding="utf-8") as f:
        kanji_db = json.load(f)

    if not os.path.isfile(kana_db_path):
        print(f"{RED}Kana DB file not found: {kana_db_path}")
        return
    with open(kana_db_path, encoding="utf-8") as f:
        kana_db = json.load(f)

    kanji_out = os.path.join(out_folder_path, "kanji")
    kana_out = os.path.join(out_folder_path, "kana")
    os.makedirs(kanji_out, exist_ok=True)
    os.makedirs(kana_out, exist_ok=True)

    if not os.path.isdir(svg_folder):
        print(f"{RED}SVG folder not found: {svg_folder}")
        return
    files = [f for f in os.listdir(svg_folder) if f.endswith(".svg")]
    total = len(files)
    kanji_count = 0
    kana_count = 0

    try:
        for index, filename in enumerate(files, start=1):
            if index % 100 == 0 or index == total:
                print(f"\r{YELLOW}{index}/{total} SVGs processed...", end="", flush=True)

            unicode = filename.replace(".svg", "").lstrip("0") or "0"

            if unicode in kanji_db:
                new_filename = unicode + ".svg"
                shutil.copy(os.path.join(svg_folder, filename), os.path.join(kanji_out, new_filename))
                kanji_count += 1
            elif unicode in kana_db:
                new_filename = unicode + ".svg"
                shutil.copy(os.path.join(svg_folder, filename), os.path.join(kana_out, new_filename))
                kana_count += 1
    except Exception as e:
        print(f"{RED}Error: {e}")
        return

    print()
    print(f"{GREEN}Done: {kanji_count} kanji SVGs, {kana_count} kana SVGs copied")

    if kanji_count == len(kanji_db):
        print(f"{GREEN}Kanji check: OK ({kanji_count}/{len(kanji_db)})")
    else:
        print(f"{RED}Kanji check: MISMATCH ({kanji_count} SVGs vs {len(kanji_db)} in DB)")

    if kana_count == len(kana_db):
        print(f"{GREEN}Kana check: OK ({kana_count}/{len(kana_db)})")
    else:
        print(f"{RED}Kana check: MISMATCH ({kana_count} SVGs vs {len(kana_db)} in DB)")

if __name__ == "__main__":
    try:
        svg_folder = sys.argv[1]
    except IndexError:
        svg_folder = str(input(f"{YELLOW}svg_folder=")) or "./kanji_source_files/kanjivg/kanji"

    try:
        kanji_db_path = sys.argv[2]
    except:
        kanji_db_path = str(input(f"{YELLOW}kanji_db_path=")) or "./kanji_db.json"

    try:
        kana_db_path = sys.argv[3]
    except:
        kana_db_path = str(input(f"{YELLOW}kana_db_path=")) or "./kana_db.json"

    try:
        out_folder_path = sys.argv[4]
    except:
        out_folder_path = str(input(f"{YELLOW}out_folder_path=")) or "./kanji_source_files/filtered"

    organize_svgs(
        svg_folder=svg_folder,
        kanji_db_path=kanji_db_path,
        kana_db_path=kana_db_path,
        out_folder_path=out_folder_path
    )