package models

import "errors"

var (
	ErrBadRequest = errors.New("bad request")
	ErrNoRowsChanged = errors.New("no rows changed")
	ErrConflict = errors.New("conflict")
	ErrInvalidListType  = errors.New("invalid list type")
    ErrInvalidListName  = errors.New("invalid list name")
    ErrInvalidListLimit = errors.New("invalid list limit")
	ErrListNotFound = errors.New("list not found")
	ErrInvalidChars = errors.New("invalid chars")
)