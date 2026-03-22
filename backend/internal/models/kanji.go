package models

import "encoding/json"

type Kanji struct {
	Unicode        string          `json:"unicode"`
	Literal        string          `json:"literal"`
	StrokeCount    int             `json:"stroke_count"`
	RadicalName    *string         `json:"radical_name"`
	FrequencyOfUse *int            `json:"frequency_of_use"`
	JlptLevel      *int            `json:"jlpt_level"`
	GradeLevel     *int            `json:"grade_level"`
	Strokes        json.RawMessage `json:"strokes"`
	Readings       json.RawMessage `json:"readings"`
	Meanings       json.RawMessage `json:"meanings"`
	Nanori         json.RawMessage `json:"nanori"`
}

type Reading struct {
    Type  string `json:"type"`
    Value string `json:"value"`
}

type Meaning struct {
    Language string `json:"language"`
    Value    string `json:"value"`
}
