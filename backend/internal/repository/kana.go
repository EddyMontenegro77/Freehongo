package repository

import (
	"database/sql"
	"fmt"
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

func GetKanaWriting(db *sql.DB, unicode string) (*models.KanaWriting, error) {
	row := db.QueryRow(`
		SELECT unicode, literal, stroke_count, strokes
		FROM japanese.kana
		WHERE unicode = $1;
	`, unicode)

	kana := &models.KanaWriting{}
	if err := row.Scan(
		&kana.Unicode,
		&kana.Literal,
		&kana.StrokeCount,
		&kana.Strokes,
	); err != nil {
		return nil, err
	}

	return kana, nil
}

func GetKanaDisplay(db *sql.DB, searchParameters *models.KanaSearch, offset int) ([]*models.KanaDisplay, error) {
	const limit = 20

	query, args := buildKanaDisplayQuery(searchParameters, limit, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]*models.KanaDisplay, 0)
	for rows.Next() {
		item := &models.KanaDisplay{}
		if err := rows.Scan(&item.Unicode, &item.Literal); err != nil {
			return nil, err
		}
		results = append(results, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

func buildKanaDisplayQuery(searchParameters *models.KanaSearch, limit, offset int) (string, []any) {
	query := `
		SELECT unicode, literal
		FROM japanese.kana
		WHERE 1 = 1
	`
	args := make([]any, 0, 6)
	argPos := 1

	if searchParameters != nil {
		query, args, argPos = addExactStringFilter(query, args, argPos, "unicode", searchParameters.Unicode)
		query, args, argPos = addExactStringFilter(query, args, argPos, "literal", searchParameters.Literal)
		if searchParameters.Type != "" && searchParameters.Type != "all" {
			query, args, argPos = addExactStringFilter(query, args, argPos, "type", searchParameters.Type)
		}
		query, args, argPos = addLikeStringFilter(query, args, argPos, "reading", searchParameters.Reading)
	}

	query += buildKanaDisplayOrderBy("")
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, limit, offset)

	return query, args
}
