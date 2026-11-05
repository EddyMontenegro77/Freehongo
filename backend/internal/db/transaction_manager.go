package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"

	"freehongo-api/internal/auth/models"
)

type TxManager struct{ db *sql.DB }

func NewTxManager(db *sql.DB) *TxManager { return &TxManager{db: db} }

func (m *TxManager) InTx(ctx context.Context, userID string, fn func(tx *sql.Tx) error) error {
	tx, err := m.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if userID != "" {
		if err := SetCurrentUserID(ctx, tx, userID); err != nil {
			return translateDatabaseError(err)
		}
	}
	if err := fn(tx); err != nil {
		return translateDatabaseError(err)
	}
	return translateDatabaseError(tx.Commit())
}

func SetCurrentUserID(ctx context.Context, tx *sql.Tx, userID string) error {
	_, err := tx.ExecContext(ctx,
		`SELECT set_config('app.current_user_id', $1, true)`, userID)
	return err
}

func translateDatabaseError(err error) error {
	if err == nil {
		return nil
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "42501" {
		return fmt.Errorf("%w: %w", models.ErrRLSPolicyViolation, err)
	}
	return err
}