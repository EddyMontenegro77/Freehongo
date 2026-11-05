package repository

import (
	"context"
	"database/sql"
	"freehongo-api/internal/lists/models"

	"github.com/lib/pq"
)

type ListQueries struct{
	tx *sql.Tx
}

func NewListQueries(tx *sql.Tx) *ListQueries { return &ListQueries{tx: tx}}


func (q *ListQueries) FetchListInfo(ctx context.Context, req models.FetchListInfoRequest, limit *int) (models.ListInfo, error) {
	if limit != nil && *limit < 0 {
		*limit = -*limit
	}
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

	rows, err := q.tx.QueryContext(ctx, `
		SELECT lc.unicode
		FROM app.list_characters lc
		WHERE lc.list_id = $1
		ORDER BY lc.created_at
		LIMIT $2
	`, req.ListId, limit)
	if err != nil {
		return models.ListInfo{}, err
	}
	defer rows.Close()

	chars := make([]string, 0)
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return models.ListInfo{}, err
		}
		chars = append(chars, c)
	}
	if err := rows.Err(); err != nil {
		return models.ListInfo{}, err
	}

	listInfo.CharUnicodes = chars

	return listInfo, nil
}

func (q *ListQueries) FetchUserLists(ctx context.Context, req models.FetchUserListsRequest, limit *int) (models.ListsGroup, error) {
	if limit != nil && *limit < 0 {
		*limit = -*limit
	}

	rows, err := q.tx.QueryContext(ctx, `
		SELECT list_id, user_id, name, created_at, updated_at, is_public, list_type
		FROM app.user_lists
		WHERE user_id = $1
		  AND deleted_at IS NULL
		  AND ($2::text IS NULL OR name ILIKE '%' || $2::text || '%')
		  AND ($3::text IS NULL OR list_type = $3::text)
		  AND ($4::boolean IS NULL OR is_public = $4::boolean)
		ORDER BY created_at DESC, list_id
		LIMIT $5 OFFSET $6
	`, req.UserId, req.Name, req.ListType, req.IsPublic, limit, req.Offset)
	if err != nil {
		return models.ListsGroup{}, err
	}
	defer rows.Close()

	lists := make([]models.ListInfo, 0)
	for rows.Next() {
		var li models.ListInfo
		if err := rows.Scan(
			&li.ListId,
			&li.UserId,
			&li.Name,
			&li.CreatedAt,
			&li.UpdatedAt,
			&li.IsPublic,
			&li.ListType,
		); err != nil {
			return models.ListsGroup{}, err
		}
		lists = append(lists, li)
	}
	if err := rows.Err(); err != nil {
		return models.ListsGroup{}, err
	}

	return models.ListsGroup{Lists: lists}, nil
}

func (q *ListQueries) CreateList(ctx context.Context, req models.CreateListRequest) error {
	_, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.user_lists (
		list_id, user_id, name, created_at, updated_at, is_public, list_type
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, req.ListId, req.UserId, req.Name, req.CreatedAt, req.UpdatedAt, req.IsPublic, req.ListType)
	return err
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
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return models.ErrNoRowsChanged
	}
	return nil
}

func (q *ListQueries) DeleteList(ctx context.Context, req models.DeleteListRequest) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.user_lists
		SET 
			updated_at = NOW(),
			deleted_at = NOW()
		WHERE list_id = $1
		AND deleted_at IS NULL
	`, req.ListId)
	return err
}

func (q *ListQueries) AddListCharacters(ctx context.Context, req models.AddListCharsRequest) error {
	_, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.list_characters (list_id, unicode)
		SELECT $1, u
		FROM unnest($2::text[]) WITH ORDINALITY AS t(u, ord)
		ORDER BY ord
		ON CONFLICT DO NOTHING
	`, req.ListId, pq.Array(req.CharUnicodes))
	return err
}

func (q *ListQueries) DeleteListCharacters(ctx context.Context, req models.DeleteListCharsRequest) error {
	res, err := q.tx.ExecContext(ctx, `
		DELETE FROM app.list_characters
		WHERE list_id = $1
		  AND unicode = ANY($2::text[])
	`, req.ListId, pq.Array(req.CharUnicodes))
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
	`, req.ListId, pq.Array(req.CharUnicodes))
	if err != nil {
		return err
	}

	return q.AddListCharacters(ctx, models.AddListCharsRequest{
		ListId:       req.ListId,
		CharUnicodes: req.CharUnicodes,
	})
}


func affectedOrErr(res sql.Result) error {
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return models.ErrNoRowsChanged
	}
	return nil
}