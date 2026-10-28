package services

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"path/filepath"
	"strings"

	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/storage"

	gowebp "github.com/linzeyan/webp-go"
	_ "golang.org/x/image/webp"
)

const maxProfilePictureBytes = 1 << 20

type ProfileService struct {
	users   *repository.UserRepository
	storage *storage.SupabaseStorage
}

func NewProfileService(users *repository.UserRepository, objectStorage *storage.SupabaseStorage) *ProfileService {
	return &ProfileService{users: users, storage: objectStorage}
}

func (s *ProfileService) UpdateUsername(ctx context.Context, userID, username string) error {
	username = strings.TrimSpace(username)
	if username == "" || len([]rune(username)) > 100 {
		return models.ErrInvalidUsername
	}
	return s.users.InTx(ctx, userID, func(q *repository.UserQueries) error {
		return q.UpdateUsername(ctx, userID, username)
	})
}

func (s *ProfileService) UpdatePicture(ctx context.Context, userID, filename string, size int64, input io.Reader) error {
	path, err := s.UploadPicture(ctx, userID, filename, size, input)
	if err != nil {
		return err
	}
	return s.users.InTx(ctx, userID, func(q *repository.UserQueries) error {
		return q.UpdatePictureURL(ctx, userID, path)
	})
}

func (s *ProfileService) UploadPicture(ctx context.Context, userID, filename string, size int64, input io.Reader) (string, error) {
	if size > maxProfilePictureBytes {
		return "", models.ErrImageTooLarge
	}
	data, err := convertToWebP(input, filename)
	if err != nil {
		return "", err
	}

	path := fmt.Sprintf("avatars/%s.webp", userID)
	if err := s.storage.Upload(ctx, path, data); err != nil {
		return "", err
	}
	return s.storage.PublicURL(path), nil
}

func (s *ProfileService) DeleteProfile(ctx context.Context, userID string) error {
	var pictureURL string
	err := s.users.InTx(ctx, userID, func(q *repository.UserQueries) error {
		profile, err := q.FetchUserProfile(ctx, userID)
		if err != nil {
			return err
		}
		pictureURL = profile.PictureUrl
		return nil
	})
	if err != nil {
		return err
	}

	if picturePath, owned := s.storage.ObjectPath(pictureURL); owned {
		if err := s.storage.Delete(ctx, picturePath); err != nil {
			return err
		}
	}
	return s.users.InTx(ctx, userID, func(q *repository.UserQueries) error {
		return q.SoftDeleteUser(ctx, userID)
	})
}

func convertToWebP(input io.Reader, filename string) ([]byte, error) {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
	default:
		return nil, models.ErrUnsupportedImage
	}

	data, err := io.ReadAll(io.LimitReader(input, maxProfilePictureBytes+1))
	if err != nil {
		return nil, err
	}
	if int64(len(data)) > maxProfilePictureBytes {
		return nil, models.ErrImageTooLarge
	}
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, models.ErrInvalidImage
	}
	bounds := img.Bounds()
	if bounds.Dx() <= 0 || bounds.Dy() <= 0 || bounds.Dx() > 4096 || bounds.Dy() > 4096 || int64(bounds.Dx())*int64(bounds.Dy()) > 16_000_000 {
		return nil, models.ErrInvalidImage
	}

	var output bytes.Buffer
	if err := gowebp.Encode(&output, img, &gowebp.Options{Lossy: true, Quality: 82, Method: 4}); err != nil {
		return nil, err
	}
	if output.Len() > maxProfilePictureBytes {
		return nil, models.ErrImageTooLarge
	}
	return output.Bytes(), nil
}
