package models

import (
	"io"
	"time"
)

const SessionCookieName = "freehongo_session"

type GoogleAuthRequest struct {
	Credential string `json:"credential" binding:"required"`
}

type GoogleIdentity struct {
	Email      string
	Name       string
	Verified   bool
	PictureUrl string
	Subject    string
}

type UserProfile struct {
	Email      string `json:"email"`
	Name       string `json:"name"`
	Verified   bool   `json:"verified"`
	PictureUrl string `json:"pictureUrl,omitempty"`
}

type UpdateProfileRequest struct {
	Username string `json:"username"`
	Name     string `json:"name"`
}

type ExistingUser struct {
	ID            string
	EmailVerified bool
}

type SignInOutcome string

const (
	OutcomeReturningUser   SignInOutcome = "returning_user"
	OutcomeLinkedToAccount SignInOutcome = "linked_to_existing_account"
	OutcomeNewAccount      SignInOutcome = "new_account"
)

type SignInResult struct {
	UserID  string        `json:"userId"`
	Outcome SignInOutcome `json:"outcome"`
	Session *Session      `json:"-"`
}

type RegisterRequest struct {
	Name        string    `json:"name" binding:"required"`
	Email       string    `json:"email" binding:"required,email"`
	Password    string    `json:"password" binding:"required,max=128"`
	PictureUrl  *string   `json:"picture,omitempty"`
	Picture     io.Reader `json:"-"`
	PictureName string    `json:"-"`
	PictureSize int64     `json:"-"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,max=128"`
}

type PasswordUser struct {
	ID           string
	PasswordHash string
}

type Session struct {
	Token     string    `json:"-"`
	ExpiresAt time.Time `json:"expiresAt"`
}
