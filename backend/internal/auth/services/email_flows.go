package services

import (
	"context"
	"fmt"
	"html"
	"net/url"
	"strings"
	"time"

	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/utils"
	emailmodels "freehongo-api/internal/emails/models"
)

const (
	emailVerificationTokenTTL = 5 * time.Minute
	passwordResetTokenTTL     = 5 * time.Minute
	emailVerificationType     = "email_verification"
	passwordResetType         = "password_reset"
)

type EmailSender interface {
	Send(ctx context.Context, req emailmodels.EmailRequest) (string, error)
}

type EmailFlows struct {
	users       *repository.UserRepository
	sender      EmailSender
	frontendURL string
}

func NewEmailFlows(users *repository.UserRepository, sender EmailSender, frontendURL string) *EmailFlows {
	return &EmailFlows{users: users, sender: sender, frontendURL: strings.TrimRight(frontendURL, "/")}
}

func (s *EmailFlows) RequestVerification(ctx context.Context, userID string) error {
	var token string
	var email string
	err := s.users.InTx(ctx, userID, func(q *repository.UserQueries) error {
		profile, err := q.FetchUserProfile(ctx, userID)
		if err != nil {
			return err
		}
		email = profile.Email
		if profile.Verified {
			return nil
		}
		var tokenHash string
		token, tokenHash, err = utils.GenerateSessionToken()
		if err != nil {
			return err
		}
		return q.InsertActionToken(ctx, userID, tokenHash, emailVerificationType, time.Now().Add(emailVerificationTokenTTL))
	})
	if err != nil || token == "" {
		return err
	}
	return s.sendVerificationEmail(ctx, email, token)
}

func (s *EmailFlows) RequestVerificationByEmail(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if err := utils.IsValidEmail(email); err != nil {
		return err
	}

	var token string
	var userEmail string
	err := s.users.InTx(ctx, "", func(q *repository.UserQueries) error {
		user, found, err := q.FindActiveUserByEmailForUpdate(ctx, email)
		if err != nil || !found || user.EmailVerified {
			return err
		}
		if err := q.SetCurrentUserID(ctx, user.ID); err != nil {
			return err
		}
		var tokenHash string
		token, tokenHash, err = utils.GenerateSessionToken()
		if err != nil {
			return err
		}
		userEmail = email
		return q.InsertActionToken(ctx, user.ID, tokenHash, emailVerificationType, time.Now().Add(emailVerificationTokenTTL))
	})
	if err != nil || token == "" {
		return err
	}
	return s.sendVerificationEmail(ctx, userEmail, token)
}

func (s *EmailFlows) VerifyEmail(ctx context.Context, token string) (models.Session, error) {
	var session models.Session
	err := s.users.InTx(ctx, "", func(q *repository.UserQueries) error {
		tokenHash := utils.HashSessionToken(token)
		userID, found, err := q.FindActiveActionTokenUser(ctx, tokenHash, emailVerificationType)
		if err != nil {
			return err
		}
		if !found {
			return models.ErrInvalidActionToken
		}
		if err := q.SetCurrentUserID(ctx, userID); err != nil {
			return err
		}
		if err := q.MarkEmailVerified(ctx, userID); err != nil {
			return err
		}
		if err := q.RevokeActionToken(ctx, tokenHash, emailVerificationType); err != nil {
			return err
		}
		session, err = createSession(ctx, q, userID)
		return err
	})
	return session, err
}

func (s *EmailFlows) RequestPasswordReset(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	var token string
	var userEmail string
	err := s.users.InTx(ctx, "", func(q *repository.UserQueries) error {
		user, found, err := q.FindActiveUserForPasswordLogin(ctx, email)
		if err != nil {
			return err
		}
		if !found {
			return nil
		}
		if err := q.SetCurrentUserID(ctx, user.ID); err != nil {
			return err
		}
		var tokenHash string
		token, tokenHash, err = utils.GenerateSessionToken()
		if err != nil {
			return err
		}
		userEmail = email
		return q.InsertActionToken(ctx, user.ID, tokenHash, passwordResetType, time.Now().Add(passwordResetTokenTTL))
	})
	if err != nil {
		return err
	}
	if token == "" {
		return nil
	}
	return s.sendPasswordResetEmail(ctx, userEmail, token)
}

func (s *EmailFlows) RequestPasswordResetForUser(ctx context.Context, userID string) error {
	var email string
	err := s.users.InTx(ctx, userID, func(q *repository.UserQueries) error {
		profile, err := q.FetchUserProfile(ctx, userID)
		if err != nil {
			return err
		}
		email = profile.Email
		return nil
	})
	if err != nil {
		return err
	}
	return s.RequestPasswordReset(ctx, email)
}

func (s *EmailFlows) ResetPassword(ctx context.Context, token, password string) error {
	if err := utils.ValidatePasswordPolicy(password); err != nil {
		return err
	}
	hash, err := utils.HashPassword(password)
	if err != nil {
		return err
	}
	tokenHash := utils.HashSessionToken(token)
	return s.users.InTx(ctx, "", func(q *repository.UserQueries) error {
		userID, found, err := q.FindActiveActionTokenUser(ctx, tokenHash, passwordResetType)
		if err != nil {
			return err
		}
		if !found {
			return models.ErrInvalidActionToken
		}
		if err := q.SetCurrentUserID(ctx, userID); err != nil {
			return err
		}
		if err := q.UpdatePassword(ctx, userID, hash); err != nil {
			return err
		}
		if err := q.RevokeAllTokens(ctx, userID); err != nil {
			return err
		}
		return q.RevokeActionToken(ctx, tokenHash, passwordResetType)
	})
}

func (s *EmailFlows) sendVerificationEmail(ctx context.Context, email, token string) error {
	link := s.frontendURL + "/auth/verify-email?token=" + url.QueryEscape(token)
	return s.send(ctx, emailmodels.NewEmailReq([]string{email}, "Verify your FreeHongo email", fmt.Sprintf("<p>Verify your email by clicking <a href=\"%s\">this link</a>.</p>", html.EscapeString(link))))
}

func (s *EmailFlows) sendPasswordResetEmail(ctx context.Context, email, token string) error {
	link := s.frontendURL + "/auth/reset-password?token=" + url.QueryEscape(token)
	return s.send(ctx, emailmodels.NewEmailReq([]string{email}, "Reset your FreeHongo password", fmt.Sprintf("<p>Reset your password by clicking <a href=\"%s\">this link</a>.</p>", html.EscapeString(link))))
}

func (s *EmailFlows) send(ctx context.Context, req emailmodels.EmailRequest) error {
	if s.sender == nil {
		return models.ErrPasswordReset
	}
	_, err := s.sender.Send(ctx, req)
	return err
}
