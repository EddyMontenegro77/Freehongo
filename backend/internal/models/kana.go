package models

import "encoding/json"

type Kana struct {
	Unicode     	string 				`json:"unicode"`
	Literal     	string 				`json:"literal"`
	Type        	string 				`json:"type"`
	StrokeCount 	int    				`json:"stroke_count"`
	Reading			string				`json:"reading"`
	Strokes     	json.RawMessage 	`json:"strokes"`
}

type KanaWriting struct{
	Unicode     	string 				`json:"unicode"`
	Literal     	string 				`json:"literal"`
	StrokeCount 	int    				`json:"stroke_count"`
	Strokes     	json.RawMessage 	`json:"strokes"`
}

type KanaDisplay struct {
	Unicode     	string 				`json:"unicode"`
	Literal     	string 				`json:"literal"`
}

type KanaDisplayPage struct {
	Items      []KanaDisplay `json:"items"`
	TotalCount int           `json:"total_count"`
}

type KanaSearch struct{
	Unicode			string
	Literal			string
	Type			string
	Reading			string
}
