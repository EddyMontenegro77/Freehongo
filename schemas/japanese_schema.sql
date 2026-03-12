CREATE SCHEMA japanese;

SET search_path TO japanese;

CREATE TABLE kana (
    unicode      VARCHAR PRIMARY KEY,
    literal      CHAR(1),
    type         VARCHAR,
    stroke_count INT,
    strokes      JSONB
);

CREATE TABLE jlpt (
    level INT PRIMARY KEY
);

CREATE TABLE grade (
    level INT PRIMARY KEY
);

CREATE TABLE language (
    code VARCHAR PRIMARY KEY
);

CREATE TABLE kanji (
    unicode        VARCHAR PRIMARY KEY,
    literal        CHAR(1),
    stroke_count   INT,
    radical_name   VARCHAR,
    frequency_of_use INT,
    strokes        JSONB,
    jlpt_level     INT REFERENCES jlpt(level),
    grade_level    INT REFERENCES grade(level)
);

CREATE TABLE reading_type (
    id   SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE
);

CREATE TABLE kanji_reading (
    id              SERIAL PRIMARY KEY,
    unicode         VARCHAR REFERENCES kanji(unicode),
    reading_type_id INT REFERENCES reading_type(id),
    value           VARCHAR
);

CREATE TABLE kanji_meaning (
    id       SERIAL PRIMARY KEY,
    unicode  VARCHAR REFERENCES kanji(unicode),
    language VARCHAR REFERENCES language(code),
    value    VARCHAR
);

CREATE TABLE kanji_nanori (
    id      SERIAL PRIMARY KEY,
    unicode VARCHAR REFERENCES kanji(unicode),
    value   VARCHAR
);