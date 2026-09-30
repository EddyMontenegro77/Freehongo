package repository

import (
	"database/sql"
	"fmt"
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
				WHERE rt.name IN ('ja_on', 'ja_kun')
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
				WHERE km.language = 'en'
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
		return nil, err
	}
	return kanji, err
}

func GetKanjiDisplay(db *sql.DB, searchParameters *models.KanjiSearch, offset int) (*models.KanjiDisplayPage, error) {
	const limit = 20

	countQuery, countArgs := buildKanjiDisplayCountQuery(searchParameters)
	var totalCount int
	if err := db.QueryRow(countQuery, countArgs...).Scan(&totalCount); err != nil {
		return nil, err
	}

	query, args := buildKanjiDisplayItemsQuery(searchParameters, limit, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]models.KanjiDisplay, 0)
	for rows.Next() {
		item := models.KanjiDisplay{}
		if err := rows.Scan(&item.Unicode, &item.Literal); err != nil {
			return nil, err
		}
		results = append(results, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.KanjiDisplayPage{
		Items:      results,
		TotalCount: totalCount,
	}, nil
}

func GetKanjiWriting(db *sql.DB, unicode string) (*models.KanjiWriting, error) {
	row := db.QueryRow(`
		SELECT unicode, literal, stroke_count, strokes
		FROM japanese.kanji
		WHERE unicode = $1;
	`, unicode)

	kanji := &models.KanjiWriting{}
	if err := row.Scan(
		&kanji.Unicode,
		&kanji.Literal,
		&kanji.StrokeCount,
		&kanji.Strokes,
	); err != nil {
		return nil, err
	}

	return kanji, nil
}

// buildKanjiDisplayBase builds the shared FROM and WHERE clause for kanji display queries.
func buildKanjiDisplayBase(searchParameters *models.KanjiSearch) (string, []any, int) {
	query := `
			FROM japanese.kanji k
		WHERE 1 = 1
	`
	args := make([]any, 0, 8)
	argPos := 1

	if searchParameters != nil {
		query, args, argPos = addExactStringFilter(query, args, argPos, "unicode", searchParameters.Unicode)
		query, args, argPos = addExactStringFilter(query, args, argPos, "literal", searchParameters.Literal)
		query, args, argPos = addLikeStringFilter(query, args, argPos, "radical_name", searchParameters.RadicalName)
		query, args, argPos = addIntFilter(query, args, argPos, "frequency_of_use", searchParameters.FrequencyOfUse)
		query, args, argPos = addIntFilter(query, args, argPos, "jlpt_level", searchParameters.JlptLevel)
		query, args, argPos = addIntFilter(query, args, argPos, "grade_level", searchParameters.GradeLevel)
		query, args, argPos = addExistsLikeFilter(
			query,
			args,
			argPos,
			`SELECT 1
			 FROM japanese.kanji_reading kr
			 WHERE kr.unicode = k.unicode
			   AND kr.value ILIKE $%d`,
			searchParameters.Reading,
		)
		query, args, argPos = addExistsLikeFilter(
			query,
			args,
			argPos,
			`SELECT 1
			 FROM japanese.kanji_meaning km
			 WHERE km.unicode = k.unicode
			   AND km.value ILIKE $%d`,
			searchParameters.Meaning,
		)
		query, args, argPos = addExistsLikeFilter(
			query,
			args,
			argPos,
			`SELECT 1
			 FROM japanese.kanji_nanori kn
			 WHERE kn.unicode = k.unicode
			   AND kn.value ILIKE $%d`,
			searchParameters.Nanori,
		)
	}

	return query, args, argPos
}

// buildKanjiDisplayCountQuery builds the count query used to calculate the total number of matches.
func buildKanjiDisplayCountQuery(searchParameters *models.KanjiSearch) (string, []any) {
	baseQuery, args, _ := buildKanjiDisplayBase(searchParameters)
	return "SELECT COUNT(*) " + baseQuery, args
}

// buildKanjiDisplayItemsQuery builds the paginated query used to fetch kanji display items.
func buildKanjiDisplayItemsQuery(searchParameters *models.KanjiSearch, limit, offset int) (string, []any) {
	baseQuery, args, argPos := buildKanjiDisplayBase(searchParameters)

	sortBy := ""
	if searchParameters != nil {
		sortBy = searchParameters.SortBy
	}

	query := "SELECT unicode, literal " + baseQuery
	query += buildKanjiDisplayOrderBy(sortBy)
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, limit, offset)

	return query, args
}
