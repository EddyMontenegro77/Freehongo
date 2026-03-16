package models

import "encoding/json"

type Kana struct {
	Unicode     	string 				`json:"unicode"`
	Literal     	string 				`json:"literal"`
	Type        	string 				`json:"type"`
	StrokeCount 	int    				`json:"stroke_count"`
	Strokes     	json.RawMessage 	`json:"strokes"`
}
