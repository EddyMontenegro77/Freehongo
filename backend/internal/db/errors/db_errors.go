package errors

import (
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrNotFound = errors.New("not found")
	ErrInvalidChars = errors.New("invalid chars")
	ErrNoRowsChanged = errors.New("no rows changed")
	ErrConflict = errors.New("conflict")
)

func MapDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, sql.ErrNoRows) || errors.Is(err, ErrNoRowsChanged) {
		return ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "42501": // RLS
			return ErrNotFound
		case "23503": // FK
			return ErrInvalidChars
		}
	}
	return err
}