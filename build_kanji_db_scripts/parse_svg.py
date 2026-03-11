import sys
import re
import os
from lxml import etree
from svgpathtools import parse_path

SVG_NS = "http://www.w3.org/2000/svg"

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def parse_svg_files(folder:str, samples=32):
    if not os.path.isdir(folder):
        print(f"{RED}SVG folder not found: {folder}")
        return
    
    files = [f for f in os.listdir(folder) if f.endswith(".svg")]
    total = len(files)
    
    results = {}
    for index, filename in enumerate(files, start=1):
        if index % 100 == 0 or index == total:
            print(f"\r{YELLOW}{index}/{total} SVGs processed...", end="", flush=True)
        svg_path = os.path.join(folder, filename)
        parsed_svg = extract_paths_from_svg(svg_path, samples)
        if parsed_svg is None:
            continue
        results[parsed_svg["unicode"]] = parsed_svg

    print()
    return results

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
            path_parameter = min(path_parameter, 1.0)
            point_complex = path.point(path_parameter)
            points.append({"x": point_complex.real, "y": point_complex.imag})
        return points
    except (ZeroDivisionError):
        print(f"{YELLOW}In sample: {sample_index}. samples must be < 1")
        return []

if __name__ == "__main__":
    folder_path = sys.argv[1]
    parse_svg_files(folder=folder_path)