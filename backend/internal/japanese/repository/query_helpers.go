package repository

import "fmt"

func addExactStringFilter(query string, args []any, argPos int, column, value string) (string, []any, int) {
	if value == "" {
		return query, args, argPos
	}

	query += fmt.Sprintf(" AND %s = $%d", column, argPos)
	args = append(args, value)
	return query, args, argPos + 1
}

func addLikeStringFilter(query string, args []any, argPos int, column, value string) (string, []any, int) {
	if value == "" {
		return query, args, argPos
	}

	query += fmt.Sprintf(" AND %s ILIKE $%d", column, argPos)
	args = append(args, "%"+value+"%")
	return query, args, argPos + 1
}

func addIntFilter(query string, args []any, argPos int, column string, value *int) (string, []any, int) {
	if value == nil {
		return query, args, argPos
	}

	query += fmt.Sprintf(" AND %s = $%d", column, argPos)
	args = append(args, *value)
	return query, args, argPos + 1
}

func addExistsLikeFilter(query string, args []any, argPos int, existsClause string, value string) (string, []any, int) {
	if value == "" {
		return query, args, argPos
	}

	query += fmt.Sprintf(" AND EXISTS (%s)", fmt.Sprintf(existsClause, argPos))
	args = append(args, "%"+value+"%")
	return query, args, argPos + 1
}

func buildKanaDisplayOrderBy() string {
	return " ORDER BY literal, unicode"
}


func buildKanjiDisplayOrderBy(sortBy, sortOrder string) string {
	direction := "ASC"
	if sortOrder == "desc" || (sortOrder == "" && sortBy == "frequency_of_use") {
		direction = "DESC"
	}

	switch sortBy {
	case "frequency_of_use":
		return " ORDER BY frequency_of_use " + direction + " NULLS LAST, literal, unicode"
	case "jlpt_level":
		return " ORDER BY jlpt_level " + direction + " NULLS LAST, literal, unicode"
	case "grade_level":
		return " ORDER BY grade_level " + direction + " NULLS LAST, literal, unicode"
	case "literal":
		fallthrough
	default:
		return " ORDER BY literal " + direction + ", unicode"
	}
}
