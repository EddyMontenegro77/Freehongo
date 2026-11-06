package models

import "errors"

var (
	ErrBadRequest = errors.New("bad request")
	ErrNoRowsChanged = errors.New("no rows changed")
	ErrConflict = errors.New("conflict")
	ErrInvalidQuizType  = errors.New("invalid quiz type")
    ErrInvalidQuizLimit = errors.New("invalid quiz limit")
	ErrQuizNotFound = errors.New("quiz not found")
	ErrInvalidChars = errors.New("invalid chars")
)
