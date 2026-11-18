package services

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/db"
	"freehongo-api/internal/storage"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestCleanupPictureQueueDeletesStorageObjectAndQueueItem(t *testing.T) {
	var deletedPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			t.Fatalf("expected DELETE, got %s", r.Method)
		}
		deletedPath = r.URL.Path
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()

	pictureURL := server.URL + "/storage/v1/object/public/freehongo-users-pfp/avatars/user-id.webp"
	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT picture_url`).
		WillReturnRows(sqlmock.NewRows([]string{"picture_url"}).AddRow(pictureURL))
	mock.ExpectCommit()
	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM app.profile_picture_cleanup`).
		WithArgs(pictureURL).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	service := NewProfileService(
		repository.NewUserRepository(db.NewTxManager(mockDB)),
		storage.NewSupabaseStorage(server.URL, "service-key"),
	)
	service.cleanupPictureQueue(context.Background())

	if deletedPath != "/storage/v1/object/freehongo-users-pfp/avatars/user-id.webp" {
		t.Fatalf("unexpected deleted path: %q", deletedPath)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestCleanupPictureQueueKeepsItemWhenStorageDeleteFails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "storage unavailable", http.StatusServiceUnavailable)
	}))
	defer server.Close()

	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()

	pictureURL := server.URL + "/storage/v1/object/public/freehongo-users-pfp/avatars/user-id.webp"
	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT picture_url`).
		WillReturnRows(sqlmock.NewRows([]string{"picture_url"}).AddRow(pictureURL))
	mock.ExpectCommit()

	service := NewProfileService(
		repository.NewUserRepository(db.NewTxManager(mockDB)),
		storage.NewSupabaseStorage(server.URL, "service-key"),
	)
	service.cleanupPictureQueue(context.Background())

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
