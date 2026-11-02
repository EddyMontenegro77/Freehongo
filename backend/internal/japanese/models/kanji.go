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

type KanjiWriting struct {
	Unicode     string          `json:"unicode"`
	Literal     string          `json:"literal"`
	StrokeCount int             `json:"stroke_count"`
	Strokes     json.RawMessage `json:"strokes"`
}

type KanjiDisplay struct {
	Unicode string `json:"unicode"`
	Literal string `json:"literal"`
}

type KanjiDisplayPage struct {
	Items      []KanjiDisplay `json:"items"`
	TotalCount int            `json:"total_count"`
}

type KanjiSearch struct {
	Unicode        string `json:"unicode"`
	Literal        string `json:"literal"`
	RadicalName    string `json:"radical_name"`
	FrequencyOfUse *int   `json:"frequency_of_use"`
	JlptLevel      *int   `json:"jlpt_level"`
	GradeLevel     *int   `json:"grade_level"`
	Reading        string `json:"reading"`
	Meaning        string `json:"meaning"`
	Nanori         string `json:"nanori"`
	SortBy         string `json:"sort_by"`
}

type Reading struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type Meaning struct {
	Language string `json:"language"`
	Value    string `json:"value"`
}
