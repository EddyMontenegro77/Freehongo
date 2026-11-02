package utils

import (
	"freehongo-api/internal/auth/models"
	"net/mail"
	"strings"
	"unicode/utf8"
)

const (
	minPasswordLen = 8
	maxPasswordLen = 128
	maxEmailLen = 254
)

func IsValidEmail(email string) error {
	if len(email) > maxEmailLen {
		return models.ErrInvalidEmail
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email {
		return models.ErrInvalidEmail
	}
	return nil
}

func NormalizeEmail(email string) (string){
	return strings.ToLower(strings.TrimSpace(email))
}

func ValidatePasswordPolicy(password string) error {
	n := utf8.RuneCountInString(password)
	if n < minPasswordLen {
		return models.ErrPasswordTooShort
	}
	if n > maxPasswordLen {
		return models.ErrPasswordTooLong
	}
	return nil
}