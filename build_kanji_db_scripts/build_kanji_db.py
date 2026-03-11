from parse_kanjidic2 import parse_kanjidic2
from parse_svg import parse_svg_files
import os
import sys
import json

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def build_kanji_db(svg_folder: str, kanjidic2_file_path: str, samples=32):
    """
    Builds a unified kanji database by merging KanjiVG stroke data with Kanjidic2 info.
    Outputs the result to kanji_db.json and kana_db.json.

    Args:
        svg_folder: Path to folder containing KanjiVG SVG files.
        kanjidic2_file_path: Path to kanjidic2.xml file.
        samples: Number of points to sample per stroke. Default 32.
    
    Returns:
        dict: Merged kanji and kana database keyed by unicode.
    """
    if not os.path.isdir(svg_folder):
        print(f"{RED}SVG folder not found: {svg_folder}")
        return

    if not os.path.isfile(kanjidic2_file_path):
        print(f"{RED}Kanjidic2 file not found: {kanjidic2_file_path}")
        return
    
    kanjidic2_db  = parse_kanjidic2(kanjidic2_file_path)
    print(f"{GREEN}Kanjidic2: {len(kanjidic2_db)} kanji loaded")

    parsed_svgs = parse_svg_files(svg_folder)
    print(f"{GREEN}SVGs: {len(parsed_svgs)} kanji parsed")

    total = len(parsed_svgs)
    kanji_db = {}
    kana_db = {}

    for index, (unicode, svg_data) in enumerate(parsed_svgs.items(), start=1):
        if index % 500 == 0 or index == total:
            print(f"\r{YELLOW}Merging: {index}/{total}...", end="", flush=True)
        kanji_data = kanjidic2_db.get(unicode)
        if kanji_data:
            kanji_db[unicode] = {**kanji_data, "strokes": svg_data["strokes"]}
        elif is_kana(unicode):
            kana_db[unicode] = {
                "literal": svg_data["literal"],
                "unicode": unicode,
                "stroke_count": len(svg_data["strokes"]),
                "strokes": svg_data["strokes"]
            }
        else:
            print(f"\n{RED}No match for {svg_data['literal']} ({unicode})")
    

    print()

    with open("kanji_db.json", "w", encoding="utf-8") as f:
        json.dump(kanji_db, f, ensure_ascii=False, indent=2)

    with open("kana_db.json", "w", encoding="utf-8") as f:
        json.dump(kana_db, f, ensure_ascii=False, indent=2)

    print(f"{GREEN}Done: {len(kanji_db)} kanji, {len(kana_db)} kana")
    return kanji_db, kana_db

def is_kana(unicode_str: str) -> bool:
    code = int(unicode_str, 16)
    return (
        0x3041 <= code <= 0x3096 or  # hiragana
        0x30A0 <= code <= 0x30FF      # katakana
    )

if __name__ == "__main__":
    try:
        svg_folder = sys.argv[1]
    except IndexError:
        svg_folder = str(input(f"{YELLOW}svg_folder="))

    try:
        kanjidic2_file_path = sys.argv[2]
    except IndexError:
        kanjidic2_file_path = str(input(f"{YELLOW}kanjidic_file_path="))

    try:
        samples = int(sys.argv[3])
    except IndexError:
        samples = int(input(f"{YELLOW}sample_count=") or 32)

    build_kanji_db(svg_folder=svg_folder, kanjidic2_file_path=kanjidic2_file_path, samples=samples)
