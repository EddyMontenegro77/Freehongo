package repository

import (
	"database/sql"
	"freehongo-api/internal/models"
)

func GetKanji(db *sql.DB, unicode string) (*models.Kanji, error) {
	row := db.QueryRow(
		`
		SELECT k.unicode, k.literal, k.stroke_count, k.radical_name, k.frequency_of_use, k.jlpt_level, k.grade_level, k.strokes,
			COALESCE(r.readings, '{}'::jsonb) AS readings,
			COALESCE(m.meanings, '{}'::jsonb) AS meanings,
			COALESCE(n.nanori, '[]'::jsonb) AS nanori
		FROM japanese.kanji k
		LEFT JOIN (
			SELECT kr.unicode, jsonb_object_agg(rt.name, kr.values) AS readings
			FROM (
				SELECT kr.unicode, rt.name, jsonb_agg(kr.value) AS values
				FROM japanese.kanji_reading kr
				JOIN japanese.reading_type rt ON rt.id = kr.reading_type_id
				GROUP BY kr.unicode, rt.name
			) kr
			JOIN japanese.reading_type rt ON rt.name = kr.name
			GROUP BY kr.unicode
		) r ON r.unicode = k.unicode
		LEFT JOIN (
			SELECT km.unicode, jsonb_object_agg(km.language, km.values) AS meanings
			FROM (
				SELECT km.unicode, km.language, jsonb_agg(km.value) AS values
				FROM japanese.kanji_meaning km
				GROUP BY km.unicode, km.language
			) km
			GROUP BY km.unicode
		) m ON m.unicode = k.unicode
		LEFT JOIN (
			SELECT kn.unicode, jsonb_agg(kn.value) AS nanori
			FROM japanese.kanji_nanori kn
			GROUP BY kn.unicode
		) n ON n.unicode = k.unicode
		WHERE k.unicode = $1;
		`, unicode)

		kanji := &models.Kanji{}
			err := row.Scan(
				&kanji.Unicode,
				&kanji.Literal,
				&kanji.StrokeCount,
				&kanji.RadicalName,
				&kanji.FrequencyOfUse,
				&kanji.JlptLevel,
				&kanji.GradeLevel,
				&kanji.Strokes,
				&kanji.Readings,
				&kanji.Meanings,
				&kanji.Nanori,
			)
			if err != nil {
				return  nil, err
			}
			return  kanji, err
}