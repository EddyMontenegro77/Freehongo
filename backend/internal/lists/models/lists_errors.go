package models

import "errors"

var (
	ErrBadRequest = errors.New("bad request")
	ErrInvalidListType  = errors.New("invalid list type")
    ErrInvalidListName  = errors.New("invalid list name")
    ErrInvalidListLimit = errors.New("invalid list limit")
)