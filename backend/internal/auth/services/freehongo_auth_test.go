package services

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/utils"
	"freehongo-api/internal/db"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestSignInRejectsUnverifiedUser(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()

	hash, err := utils.HashPassword("password123")
	if err != nil {
		t.Fatal(err)
	}
	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT user_id, password_hash, email_verified_at`).
		WithArgs("user@example.com").
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "password_hash", "email_verified_at"}).
			AddRow("user-id", hash, nil))
	mock.ExpectRollback()

	service := NewFreeHongoAuthService(repository.NewUserRepository(db.NewTxManager(mockDB)))
	_, err = service.SignIn(context.Background(), models.LoginRequest{
		Email: "user@example.com", Password: "password123",
	})
	if !errors.Is(err, models.ErrEmailNotVerified) {
		t.Fatalf("expected ErrEmailNotVerified, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestSignInCreatesSessionForVerifiedUser(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()

	hash, err := utils.HashPassword("password123")
	if err != nil {
		t.Fatal(err)
	}
	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT user_id, password_hash, email_verified_at`).
		WithArgs("user@example.com").
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "password_hash", "email_verified_at"}).
			AddRow("user-id", hash, time.Now()))
	mock.ExpectExec(`SELECT set_config\('app.current_user_id', \$1, true\)`).
		WithArgs("user-id").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`INSERT INTO app.user_tokens`).
		WithArgs("user-id", sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	service := NewFreeHongoAuthService(repository.NewUserRepository(db.NewTxManager(mockDB)))
	if _, err := service.SignIn(context.Background(), models.LoginRequest{
		Email: "user@example.com", Password: "password123",
	}); err != nil {
		t.Fatal(err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestSignUpDoesNotCreateSession(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()

	mock.ExpectBegin()
	mock.ExpectExec(`SELECT set_config\('app.current_user_id', \$1, true\)`).
		WithArgs(sqlmock.AnyArg()).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(`INSERT INTO app.users`).
		WithArgs(sqlmock.AnyArg(), "User", "user@example.com", sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow("user-id"))
	mock.ExpectCommit()

	service := NewFreeHongoAuthService(repository.NewUserRepository(db.NewTxManager(mockDB)))
	if err := service.SignUp(context.Background(), models.RegisterRequest{
		Name: "User", Email: "user@example.com", Password: "password123",
	}); err != nil {
		t.Fatal(err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestSignUpRejectsDuplicateEmail(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()

	mock.ExpectBegin()
	mock.ExpectExec(`SELECT set_config\('app.current_user_id', \$1, true\)`).
		WithArgs(sqlmock.AnyArg()).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(`INSERT INTO app.users`).
		WillReturnError(&pgconn.PgError{Code: "23505"})
	mock.ExpectRollback()

	service := NewFreeHongoAuthService(repository.NewUserRepository(db.NewTxManager(mockDB)))
	err = service.SignUp(context.Background(), models.RegisterRequest{
		Name: "User", Email: "user@example.com", Password: "password123",
	})
	if !errors.Is(err, models.ErrEmailTaken) {
		t.Fatalf("expected ErrEmailTaken, got %v", err)
	}
}

func TestGoogleSignInRejectsUnverifiedGoogleClaims(t *testing.T) {
	service := NewGoogleSignInService(nil)
	_, err := service.SignIn(context.Background(), models.GoogleIdentity{
		Email: "user@example.com", Subject: "google-subject", Verified: false,
	})
	if !errors.Is(err, models.ErrInvalidGoogleClaims) {
		t.Fatalf("expected ErrInvalidGoogleClaims, got %v", err)
	}
}

func TestGoogleSignInCreatesVerifiedAccountAndSession(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT app\.find_user_by_identity`).
		WithArgs("google-subject").
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow(nil))
	mock.ExpectQuery(`SELECT user_id, email_verified_at`).
		WithArgs("user@example.com").
		WillReturnError(sql.ErrNoRows)
	mock.ExpectExec(`SELECT set_config\('app.current_user_id', \$1, true\)`).
		WithArgs(sqlmock.AnyArg()).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(`INSERT INTO app.users`).
		WithArgs(sqlmock.AnyArg(), "User", "user@example.com", "https://example.com/avatar.jpg").
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow("user-id"))
	mock.ExpectExec(`INSERT INTO app.user_identities`).
		WithArgs("user-id", "google-subject").WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectExec(`INSERT INTO app.user_tokens`).
		WithArgs("user-id", sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	service := NewGoogleSignInService(repository.NewUserRepository(db.NewTxManager(mockDB)))
	result, err := service.SignIn(context.Background(), models.GoogleIdentity{
		Email: "user@example.com", Name: "User", Verified: true,
		Subject: "google-subject", PictureUrl: "https://example.com/avatar.jpg",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.Outcome != models.OutcomeNewAccount || result.Session == nil {
		t.Fatalf("unexpected Google sign-in result: %+v", result)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
