package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	dbErrors "freehongo-api/internal/db/errors"
	"freehongo-api/internal/lists/models"
)

type ListQueries struct {
	tx *sql.Tx
}

func NewListQueries(tx *sql.Tx) *ListQueries { return &ListQueries{tx: tx} }


func (q *ListQueries) FetchList(ctx context.Context, req models.FetchListRequest, limit *int) (models.ListInfo, error) {
	var listInfo models.ListInfo

	err := q.tx.QueryRowContext(ctx, `
		SELECT list_id, user_id, name, created_at, updated_at, is_public, list_type
		FROM app.user_lists
		WHERE list_id = $1
		  AND deleted_at IS NULL
	`, req.ListId).Scan(
		&listInfo.ListId,
		&listInfo.UserId,
		&listInfo.Name,
		&listInfo.CreatedAt,
		&listInfo.UpdatedAt,
		&listInfo.IsPublic,
		&listInfo.ListType,
	)
	if err != nil {
		return models.ListInfo{}, err
	}

	listInfo.CharUnicodes, err = q.fetchListChars(ctx, listInfo.ListId, limit)
	if err != nil {
		return models.ListInfo{}, err
	}

	return listInfo, nil
}

func (q *ListQueries) FetchPublicList(ctx context.Context, req models.FetchListRequest, ownerID *string, charLimit *int) (models.ListInfo, error) {
	var li models.ListInfo

	err := q.tx.QueryRowContext(ctx, `
		SELECT list_id, user_id, name, created_at, updated_at, is_public, list_type
		FROM app.user_lists
		WHERE list_id = $1
		  AND is_public = true
		  AND deleted_at IS NULL
		  AND ($2::uuid IS NULL OR user_id = $2::uuid)
	`, req.ListId, ownerID).Scan(&li.ListId, &li.UserId, &li.Name, &li.CreatedAt,
		&li.UpdatedAt, &li.IsPublic, &li.ListType)
	if err != nil {
		return models.ListInfo{}, err
	}

	li.CharUnicodes, err = q.fetchListChars(ctx, li.ListId, charLimit)
	if err != nil {
		return models.ListInfo{}, err
	}
	return li, nil
}

func (q *ListQueries) FetchPublicLists(ctx context.Context, req models.FetchPublicListsRequest, ownerID *string, pageLimit, sampleLimit int) (models.ListsGroup, error) {
	rows, err := q.tx.QueryContext(ctx, `
		SELECT l.list_id, l.user_id, l.name, l.created_at, l.updated_at,
		       l.is_public, l.list_type,
		       COALESCE(s.chars, '[]'::json)
		FROM app.user_lists l
		LEFT JOIN LATERAL (
			SELECT json_agg(x.unicode ORDER BY x.list_character_id) AS chars
			FROM (
				SELECT lc.unicode, lc.list_character_id
				FROM app.list_characters lc
				WHERE lc.list_id = l.list_id
				ORDER BY lc.list_character_id
				LIMIT $5
			) x
		) s ON true
		WHERE l.is_public = true
		  AND l.deleted_at IS NULL
		  AND ($1::text IS NULL OR l.name ILIKE '%' || $1::text || '%')
		  AND ($2::text IS NULL OR l.list_type = $2::text)
		  AND ($6::uuid IS NULL OR l.user_id = $6::uuid)
		ORDER BY l.created_at DESC, l.list_id
		LIMIT $3 OFFSET $4
	`, req.Name, req.ListType, pageLimit, req.Offset, sampleLimit, ownerID)
	if err != nil {
		return models.ListsGroup{}, err
	}
	defer rows.Close()

	lists := make([]models.ListInfo, 0)
	for rows.Next() {
		var li models.ListInfo
		var chars []byte
		if err := rows.Scan(&li.ListId, &li.UserId, &li.Name, &li.CreatedAt,
			&li.UpdatedAt, &li.IsPublic, &li.ListType, &chars); err != nil {
			return models.ListsGroup{}, err
		}
		if err := json.Unmarshal(chars, &li.CharUnicodes); err != nil {
			return models.ListsGroup{}, err
		}
		lists = append(lists, li)
	}
	if err := rows.Err(); err != nil {
		return models.ListsGroup{}, err
	}
	return models.ListsGroup{Lists: lists}, nil
}

func (q *ListQueries) FetchUserLists(ctx context.Context, req models.FetchUserListsRequest, pageLimit *int, sampleLimit *int, userId string) (models.ListsGroup, error) {
	rows, err := q.tx.QueryContext(ctx, `
		SELECT l.list_id, l.user_id, l.name, l.created_at, l.updated_at,
		       l.is_public, l.list_type,
		       COALESCE(s.chars, '[]'::json)
		FROM app.user_lists l
		LEFT JOIN LATERAL (
			SELECT json_agg(x.unicode ORDER BY x.list_character_id) AS chars
			FROM (
				SELECT lc.unicode, lc.list_character_id
				FROM app.list_characters lc
				WHERE lc.list_id = l.list_id
				ORDER BY lc.list_character_id
				LIMIT $7
			) x
		) s ON true
		WHERE l.user_id = $1
		  AND l.deleted_at IS NULL
		  AND ($2::text IS NULL OR l.name ILIKE '%' || $2::text || '%')
		  AND ($3::text IS NULL OR l.list_type = $3::text)
		  AND ($4::boolean IS NULL OR l.is_public = $4::boolean)
		ORDER BY l.created_at DESC, l.list_id
		LIMIT $5 OFFSET $6
	`, userId, req.Name, req.ListType, req.IsPublic, pageLimit, req.Offset, sampleLimit)
	if err != nil {
		return models.ListsGroup{}, err
	}
	defer rows.Close()

	lists := make([]models.ListInfo, 0)
	for rows.Next() {
		var li models.ListInfo
		var chars []byte
		if err := rows.Scan(&li.ListId, &li.UserId, &li.Name, &li.CreatedAt,
			&li.UpdatedAt, &li.IsPublic, &li.ListType, &chars); err != nil {
			return models.ListsGroup{}, err
		}
		if err := json.Unmarshal(chars, &li.CharUnicodes); err != nil {
			return models.ListsGroup{}, err
		}
		lists = append(lists, li)
	}
	if err := rows.Err(); err != nil {
		return models.ListsGroup{}, err
	}
	return models.ListsGroup{Lists: lists}, nil
}



func (q *ListQueries) CreateList(ctx context.Context, req models.CreateListRequest, userId string) (created bool, err error) {
	res, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.user_lists (
			list_id, user_id, name, created_at, updated_at, is_public, list_type
		)
		VALUES ($1, $2, $3, $4, NOW(), $5, $6)
		ON CONFLICT (list_id) DO NOTHING
		`, req.ListId, userId, req.Name, req.CreatedAt, req.IsPublic, req.ListType)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}

func (q *ListQueries) UpdateList(ctx context.Context, req models.UpdateListRequest) error {
	res, err := q.tx.ExecContext(ctx, `
		UPDATE app.user_lists
		SET
			updated_at = NOW(),
			name = $1,
			is_public = $2,
			list_type = $3
		WHERE list_id = $4
		AND deleted_at IS NULL
	`, req.Name, req.IsPublic, req.ListType, req.ListId)
	if err != nil {
		return err
	}
	return affectedOrErr(res)
}

func (q *ListQueries) DeleteList(ctx context.Context, req models.DeleteListRequest) error {
	res, err := q.tx.ExecContext(ctx, `
		UPDATE app.user_lists
		SET 
			updated_at = NOW(),
			deleted_at = NOW()
		WHERE list_id = $1
		AND deleted_at IS NULL
	`, req.ListId)
	if err != nil {
		return err
	}
	return affectedOrErr(res)
}

func (q *ListQueries) AddListCharacters(ctx context.Context, req models.AddListCharsRequest) error {
	if _, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.list_characters (list_id, unicode)
		SELECT $1::uuid, u
		FROM unnest($2::text[]) WITH ORDINALITY AS t(u, ord)
		ORDER BY ord
		ON CONFLICT DO NOTHING
	`, req.ListId, req.CharUnicodes); err != nil {
		return err
	}
	return q.touchList(ctx, req.ListId)
}

func (q *ListQueries) DeleteListCharacters(ctx context.Context, req models.DeleteListCharsRequest) error {
	res, err := q.tx.ExecContext(ctx, `
		DELETE FROM app.list_characters
		WHERE list_id = $1
		  AND unicode = ANY($2::text[])
	`, req.ListId, req.CharUnicodes)
	if err != nil {
		return err
	}
	return affectedOrErr(res)
}

func (q *ListQueries) UpdateListCharacters(ctx context.Context, req models.UpdateListCharsRequest) error {
	_, err := q.tx.ExecContext(ctx, `
		DELETE FROM app.list_characters
		WHERE list_id = $1
		  AND NOT (unicode = ANY($2::text[]))
	`, req.ListId, req.CharUnicodes)
	if err != nil {
		return err
	}

	return q.AddListCharacters(ctx, models.AddListCharsRequest{
		ListId:       req.ListId,
		CharUnicodes: req.CharUnicodes,
	})
}

func (q *ListQueries) OwnsList(ctx context.Context, listID, userID string) (bool, error) {
	var ok bool
	err := q.tx.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM app.user_lists
			WHERE list_id = $1 AND user_id = $2
		)`, listID, userID).Scan(&ok)
	return ok, err
}

func (q *ListQueries) fetchListChars(ctx context.Context, listID string, charLimit *int) ([]string, error) {
	rows, err := q.tx.QueryContext(ctx, `
		SELECT unicode
		FROM app.list_characters
		WHERE list_id = $1
		ORDER BY list_character_id
		LIMIT $2
	`, listID, charLimit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	chars := make([]string, 0)
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return nil, err
		}
		chars = append(chars, c)
	}
	return chars, rows.Err()
}

func (q *ListQueries) touchList(ctx context.Context, listID string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.user_lists SET updated_at = NOW()
		WHERE list_id = $1 AND deleted_at IS NULL
	`, listID)
	return err
}

func affectedOrErr(res sql.Result) error {
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return dbErrors.ErrNoRowsChanged
	}
	return nil
}