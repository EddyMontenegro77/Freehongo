package utils

import (
	"database/sql"
	"errors"
	"testing"

	dbErrors "freehongo-api/internal/db/errors"
	"freehongo-api/internal/lists/models"
)

func TestNormalizeListType(t *testing.T) {
	value := "  KANJI "

	got, err := NormalizeListType(&value)

	if err != nil || got == nil || *got != string(models.Kanji) {
		t.Fatalf("NormalizeListType() = %v, %v; want kanji, nil", got, err)
	}

	if got, err := NormalizeListType(nil); err != nil || got != nil {
		t.Fatalf("NormalizeListType(nil) = %v, %v; want nil, nil", got, err)
	}
}

func TestNormalizeListTypeRejectsUnknownType(t *testing.T) {
	value := "romaji"

	if _, err := NormalizeListType(&value); !errors.Is(err, models.ErrInvalidListType) {
		t.Fatalf("NormalizeListType() error = %v; want ErrInvalidListType", err)
	}
}

func TestMapDBError(t *testing.T) {
	tests := []struct {
		name string
		in   error
		want error
	}{
		{name: "no rows", in: sql.ErrNoRows, want: dbErrors.ErrNotFound},
		{name: "no changes", in: dbErrors.ErrNoRowsChanged, want: dbErrors.ErrNotFound},
		{name: "nil", in: nil, want: nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := MapDBError(tt.in); !errors.Is(got, tt.want) {
				t.Fatalf("MapDBError(%v) = %v; want %v", tt.in, got, tt.want)
			}
		})
	}
}
