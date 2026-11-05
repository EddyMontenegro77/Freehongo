package models

import "errors"

var (
	ErrBadRequest = errors.New("bad request")
	ErrNoRowsChanged = errors.New("no rows changed")
)