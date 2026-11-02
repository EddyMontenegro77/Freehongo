package services

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestPasswordResetDoesNotRevealUnknownEmail(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT user_id, password_hash, email_verified_at`).
		WithArgs("unknown@example.com").WillReturnError(sql.ErrNoRows)
	mock.ExpectCommit()

	service := NewEmailFlows(repository.NewUserRepository(db), nil, "https://frontend.example")
	if err := service.RequestPasswordReset(context.Background(), "unknown@example.com"); err != nil {
		t.Fatal(err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestVerifyEmailRejectsInvalidOrExpiredToken(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT app\.validate_action_token`).
		WithArgs(sqlmock.AnyArg(), "email_verification").
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow(nil))
	mock.ExpectRollback()

	service := NewEmailFlows(repository.NewUserRepository(db), nil, "https://frontend.example")
	_, err = service.VerifyEmail(context.Background(), "expired-token")
	if !errors.Is(err, models.ErrInvalidActionToken) {
		t.Fatalf("expected ErrInvalidActionToken, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestVerifyEmailCreatesSession(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT app\.validate_action_token`).
		WithArgs(sqlmock.AnyArg(), "email_verification").
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow("user-id"))
	mock.ExpectExec(`SELECT set_config\('app.current_user_id', \$1, true\)`).
		WithArgs("user-id").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`UPDATE app.users SET email_verified_at`).
		WithArgs("user-id").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`UPDATE app.user_tokens`).
		WithArgs(sqlmock.AnyArg(), "email_verification").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`INSERT INTO app.user_tokens`).
		WithArgs("user-id", sqlmock.AnyArg(), sqlmock.AnyArg()).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	service := NewEmailFlows(repository.NewUserRepository(db), nil, "https://frontend.example")
	session, err := service.VerifyEmail(context.Background(), "verification-token")
	if err != nil {
		t.Fatal(err)
	}
	if session.Token == "" {
		t.Fatal("expected a session token")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
