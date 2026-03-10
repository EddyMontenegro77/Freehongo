import sys
import xml.etree.ElementTree as ET

def parse_kanjidic2(xml_path: str) -> dict:
    """
    Args:
        xml_path: Kanjidic2 XML path.

    Returns:
        db: Dictionary database with all characters parsed.
    """
    print(f"Parsing Kanjidic2: {xml_path}");
    parser = ET.XMLParser()
    tree = ET.parse(xml_path, parser=parser)
    root = tree.getroot()
    print(root.tag)
    print(root.attrib)

    db = {}
    characters = root.findall("character");
    total = len(characters)

    for index, character in enumerate(characters, start=1):
        if index % 100 == 0:
            print(f"{index}/{total} characters processed...")
        processed_character = process_character(character)
        db[processed_character["unicode"]] = processed_character

    print()
    return db


def process_character(character):
    """
    Parses a <character> element of the XML file and returns a dictionary with its data

    Args:
        character: XML Element <character> of kanjidic2.

    Returns:
        Dict: Dictionary with kanji's fields: literal, unicode, grade, stroke_count,
        radical_name, frequency_of_use, jlpt_level, readings{}, meanings{}, nanori[].
    """

    literal = character.find('literal').text

    codepoint = character.find('codepoint')
    unicode = codepoint.findtext("cp_value[@cp_type='ucs']")

    misc = character.find('misc')
    grade = to_int(misc.findtext('grade'))
    stroke_count = to_int(misc.findtext('stroke_count'))
    radical_name = misc.findtext('rad_name')
    frequency_of_use = to_int(misc.findtext('freq'))
    jlpt_level = to_int(misc.findtext('jlpt'))

    reading_meaning = character.find('reading_meaning')
    readings, meanings = get_character_readings_meanings(reading_meaning)

    nanori_list = get_nanoris(reading_meaning)

    return  {
        "literal": literal,
        "unicode": unicode,
        "grade": grade,
        "stroke_count": stroke_count,
        "radical_name": radical_name,
        "frequency_of_use": frequency_of_use,
        "jlpt_level": jlpt_level,
        "readings": readings,
        "meanings": meanings,
        "nanori": nanori_list
    }
    

def get_character_readings_meanings(reading_meaning_element):
    rmgroups = reading_meaning_element.findall('rmgroup')

    readings_dict = {}
    meanings_dict = {}

    for rmgroup in rmgroups:
        readings = rmgroup.findall('reading')
        meanings = rmgroup.findall('meaning')

        for reading in readings:
            reading_type = reading.get("r_type")
            readings_dict.setdefault(reading_type, []).append(reading.text)
        
        for meaning in meanings:
            meaning_language = meaning.get('m_lang')
            if(meaning_language is None):
                meaning_language = 'en'
            meanings_dict.setdefault(meaning_language, []).append(meaning.text)
    
    return readings_dict, meanings_dict

def get_nanoris(reading_meaning_element):
    nanori_elements_list = reading_meaning_element.findall('nanori')
    nanori_list = []
    for nanori in nanori_elements_list:
        nanori_list.append(nanori.text)
    return nanori_list
        

def to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


if __name__ == "__main__":
    xml_path = sys.argv[1]
    parse_kanjidic2(xml_path)