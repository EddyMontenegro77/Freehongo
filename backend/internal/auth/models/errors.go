package models

import "errors"

var (
	ErrGoogleClientIDNotConfigured = errors.New("google client id not configured")
	ErrInvalidGoogleToken          = errors.New("invalid google token")
	ErrEmailNotVerified            = errors.New("google email not verified")
	ErrInvalidGoogleClaims         = errors.New("invalid google token claims")
	ErrBadRequest                  = errors.New("bad request")

	ErrInvalidEmailFormat = errors.New("invalid email format")
	ErrPasswordTooShort   = errors.New("password too short")
	ErrPasswordTooLong    = errors.New("password too long")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidEmail       = errors.New("invalid email")
	ErrRLSPolicyViolation = errors.New("row-level security policy violation")
	ErrInvalidUsername    = errors.New("invalid username")
	ErrImageTooLarge      = errors.New("image too large")
	ErrUnsupportedImage   = errors.New("unsupported image")
	ErrInvalidImage       = errors.New("invalid image")
)
