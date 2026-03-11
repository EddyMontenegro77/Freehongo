import sys
import re
import os
from lxml import etree
from svgpathtools import parse_path

SVG_NS = "http://www.w3.org/2000/svg"

def parse_svg_files(folder:str):
    results = {}
    for filename in os.listdir(folder):
        if filename.endswith(".svg"):
            svg_path = os.path.join(folder, filename)
            parsed_svg = extract_paths_from_svg(svg_path)
            results[parsed_svg["kanji_id"]] = parsed_svg
    print(results)
    return results

def extract_paths_from_svg(svg_path):
    parser = etree.XMLParser(recover=True)
    tree = etree.parse(svg_path, parser)
    root = tree.getroot()

    paths = root.findall(f".//{{{SVG_NS}}}path")

    # Getting g element with the kanji info
    root_g = next(g for g in root.findall(".//{*}g") 
              if re.fullmatch(r"kvg:[0-9a-f]+", g.attrib.get("id", "")))
    
    kanji_id = root_g.attrib.get("id", "").replace("kvg:", "")
    literal = chr(int(kanji_id, 16))

    strokes = []
    for path in paths:
        d = path.attrib.get("d")
        if not d:
            continue
        points = path_to_points(d)
        strokes.append(points)
    
    return {
        "kanji_id": kanji_id,
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
            path_parameter = path.ilength(distance_along_path) # converts px to t => parameter
            point_complex = path.point(path_parameter)
            points.append({"x": point_complex.real, "y": point_complex.imag})
        return points
    except (ZeroDivisionError):
        print("Samples must be < 1")
        return []

if __name__ == "__main__":
    folder_path = sys.argv[1]
    parse_svg_files(folder=folder_path)