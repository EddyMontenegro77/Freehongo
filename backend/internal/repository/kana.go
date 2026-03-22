package repository

import (
	"database/sql"
	"freehongo-api/internal/models"
)

func GetKana(db *sql.DB, unicode string) (*models.Kana, error) {
	row := db.QueryRow(`
		SELECT unicode, literal, type, stroke_count, reading, strokes
		FROM japanese.kana
		WHERE unicode = $1;
	`, unicode)

	kana := &models.Kana{}
		err := row.Scan(
			&kana.Unicode,
			&kana.Literal,
			&kana.Type,
			&kana.StrokeCount,
			&kana.Reading,
			&kana.Strokes,
		)
		if err != nil {
			return nil, err
		}
		return kana, nil
}