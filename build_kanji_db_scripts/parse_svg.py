import sys
import re
import os
from lxml import etree
from svgpathtools import parse_path
from multiprocessing import Pool, cpu_count 

SVG_NS = "http://www.w3.org/2000/svg"

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def parse_svg_files(folder:str, samples=32):
    """
    Parses all KanjiVG SVG files in a folder and extracts stroke point data.

    Args:
        folder: Path to folder containing SVG files.
        samples: Number of points to sample per stroke. Default 32.

    Returns:
        dict: Kanji data keyed by unicode, each containing literal and strokes.
    """
    if not os.path.isdir(folder):
        print(f"{RED}SVG folder not found: {folder}")
        return
    
    files = [f for f in os.listdir(folder) if f.endswith(".svg")]
    total = len(files)
    args = [(os.path.join(folder, f), samples) for f in files]
    
    results = {}
    with Pool(cpu_count()) as pool:
        for index, parsed_svg in enumerate(pool.imap_unordered(extract_paths_from_svg_tuple, args), start=1):
            if index % 100 == 0 or index == total:
                print(f"\r{YELLOW}{index}/{total} SVGs processed...", end="", flush=True)
            if parsed_svg is None:
                continue
            results[parsed_svg["unicode"]] = parsed_svg

    print()
    return results

def extract_paths_from_svg_tuple(args):
    return extract_paths_from_svg(*args)

def extract_paths_from_svg(svg_path, samples=32):
    parser = etree.XMLParser(recover=True)
    tree = etree.parse(svg_path, parser)
    root = tree.getroot()

    paths = root.findall(f".//{{{SVG_NS}}}path")

    # Getting g element with the kanji info
    try:
        root_g = next(g for g in root.findall(".//{*}g") 
                if re.fullmatch(r"kvg:[0-9a-f]+(-\w+)?", g.attrib.get("id", "")))
    except StopIteration:
        print(f"{YELLOW}No root g found in {svg_path}, skipping")
        return None
    
    kanji_unicode = re.sub(r"^kvg:|(-\w+)$", "", root_g.attrib.get("id", ""))
    kanji_unicode = kanji_unicode.lstrip("0") or "0" # No left 0's normalization
    
    literal = chr(int(kanji_unicode, 16))

    strokes = []
    for path in paths:
        d = path.attrib.get("d")
        if not d:
            continue
        points = path_to_points(d, samples)
        strokes.append(points)
    
    return {
        "unicode": kanji_unicode,
        "literal": literal,
        "strokes": strokes
    }


def path_to_points(d:str, samples=32):
    """
    Converts SVG path "d" to an array of points (x,y) with real longitude sampling
    """

    # Converts SVG string to a math object representing bezier curves
    path = parse_path(d)

    total_length = path.length() # px size
    points = []
    try:
        for sample_index in range(samples):
            distance_along_path = total_length * sample_index / (samples - 1)
            distance_along_path = min(distance_along_path, total_length) # Clamp
            path_parameter = path.ilength(distance_along_path) # converts px to t => parameter
            path_parameter = round(min(max(path_parameter, 0.0), 1.0), 10)  # clamp [0, 1]
            point_complex = path.point(path_parameter)
            points.append({"x": point_complex.real, "y": point_complex.imag})
        return points
    except (ZeroDivisionError):
        print(f"{YELLOW}In sample: {sample_index}. samples must be < 1")
        return []

if __name__ == "__main__":
    folder_path = sys.argv[1]
    parse_svg_files(folder=folder_path)