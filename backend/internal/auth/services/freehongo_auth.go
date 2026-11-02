package services

import (
	"context"
	"strings"
	"time"
	"unicode/utf8"

	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/utils"
)

const sessionTTL = 30 * 24 * time.Hour

var dummyHash, _ = utils.HashPassword("dummy-password-for-timing")

type FreeHongoAuthService struct {
	users   *repository.UserRepository
	profile *ProfileService
}

func NewFreeHongoAuthService(users *repository.UserRepository, profiles ...*ProfileService) *FreeHongoAuthService {
	var profile *ProfileService
	if len(profiles) > 0 {
		profile = profiles[0]
	}
	return &FreeHongoAuthService{users: users, profile: profile}
}

func (s *FreeHongoAuthService) SignUp(ctx context.Context, req models.RegisterRequest) error {
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" || utf8.RuneCountInString(req.Name) > 100 {
		return models.ErrBadRequest
	}
	email := utils.NormalizeEmail(req.Email)
	if err := utils.IsValidEmail(email); err != nil {
		return err
	}
	if err := utils.ValidatePasswordPolicy(req.Password); err != nil {
		return err
	}

	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return err
	}

	userID, err := repository.NewUUIDv7()
	if err != nil {
		return err
	}
	err = s.users.InTx(ctx, userID, func(q *repository.UserQueries) error {
		userID, err := q.InsertUserWithPassword(ctx, userID, req.Name, email, passwordHash)
		if err != nil {
			if repository.IsUniqueViolation(err) {
				return models.ErrEmailTaken
			}
			return err
		}
		if req.Picture != nil {
			if s.profile == nil {
				return models.ErrInvalidImage
			}
			pictureURL, err := s.profile.UploadPicture(ctx, userID, req.PictureName, req.PictureSize, req.Picture)
			if err != nil {
				return err
			}
			if err := q.UpdatePictureURL(ctx, userID, pictureURL); err != nil {
				return err
			}
		}
		return nil
	})
	return err
}

func (s *FreeHongoAuthService) SignIn(ctx context.Context, req models.LoginRequest) (models.Session, error) {
	email := utils.NormalizeEmail(req.Email)
	if err := utils.IsValidEmail(email); err != nil {
		return models.Session{}, models.ErrInvalidCredentials
	}

	var session models.Session
	err := s.users.InTx(ctx, "", func(q *repository.UserQueries) error {
		user, found, err := q.FindActiveUserForPasswordLogin(ctx, email)
		if err != nil {
			return err
		}

		hash := dummyHash
		if found && user.PasswordHash != "" {
			hash = user.PasswordHash
		}

		passwordMatches, err := utils.CheckPassword(hash, req.Password)
		if err != nil {
			return err
		}
		if !found || user.PasswordHash == "" || !passwordMatches {
			return models.ErrInvalidCredentials
		}
		if !user.EmailVerified {
			return models.ErrEmailNotVerified
		}
		if err := q.SetCurrentUserID(ctx, user.ID); err != nil {
			return err
		}

		session, err = createSession(ctx, q, user.ID)
		return err
	})
	return session, err
}

func (s *FreeHongoAuthService) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}

	tokenHash := utils.HashSessionToken(token)
	return s.users.InTx(ctx, "", func(q *repository.UserQueries) error {
		userID, found, err := q.FindActiveSessionUser(ctx, tokenHash)
		if err != nil || !found {
			return err
		}
		if err := q.SetCurrentUserID(ctx, userID); err != nil {
			return err
		}
		return q.RevokeSessionToken(ctx, tokenHash)
	})
}

func createSession(ctx context.Context, q *repository.UserQueries, userID string) (models.Session, error) {
	token, tokenHash, err := utils.GenerateSessionToken()
	if err != nil {
		return models.Session{}, err
	}

	expiresAt := time.Now().Add(sessionTTL)
	if err := q.InsertSessionToken(ctx, userID, tokenHash, expiresAt); err != nil {
		return models.Session{}, err
	}
	return models.Session{Token: token, ExpiresAt: expiresAt}, nil
}
