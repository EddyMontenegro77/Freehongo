package services

import (
	"context"
	"strings"

	"google.golang.org/api/idtoken"

	"freehongo-api/internal/auth/models"
)

type GoogleVerifier struct{ clientID string }

func NewGoogleVerifier(clientID string) (*GoogleVerifier, error) {
	if strings.TrimSpace(clientID) == "" {
		return nil, models.ErrGoogleClientIDNotConfigured
	}
	return &GoogleVerifier{clientID: clientID}, nil
}

func (v *GoogleVerifier) VerifyGoogleToken(ctx context.Context, credential string) (models.GoogleIdentity, error) {
	payload, err := idtoken.Validate(ctx, credential, v.clientID)
	if err != nil {
		return models.GoogleIdentity{}, models.ErrInvalidGoogleToken
	}

	email, ok := payload.Claims["email"].(string)
	if !ok || strings.TrimSpace(email) == "" || payload.Subject == "" {
		return models.GoogleIdentity{}, models.ErrInvalidGoogleClaims
	}

	verified, ok := payload.Claims["email_verified"].(bool)
	if !ok {
		return models.GoogleIdentity{}, models.ErrInvalidGoogleClaims
	}

	if !verified {
		return models.GoogleIdentity{}, models.ErrEmailNotVerified
	}

	name, _ := payload.Claims["name"].(string)
	picture, _ := payload.Claims["picture"].(string)

	return models.GoogleIdentity{
		Email:      strings.ToLower(strings.TrimSpace(email)),
		Verified:   verified,
		Name:       name,
		PictureUrl: picture,
		Subject:    payload.Subject,
	}, nil
}
