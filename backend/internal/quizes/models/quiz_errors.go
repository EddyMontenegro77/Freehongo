package models

import "errors"

var (
	ErrBadRequest = errors.New("bad request")
	ErrInvalidQuizType  = errors.New("invalid quiz type")
    ErrInvalidQuizLimit = errors.New("invalid quiz limit")
	ErrQuizNotFound = errors.New("quiz not found")

	ErrInvalidAnswerType     = errors.New("invalid_answer_type")
	ErrInvalidCharQuizType   = errors.New("invalid_character_quiz_type")
	ErrInvalidQuizTimes      = errors.New("invalid_quiz_times")
	ErrInvalidQuizAnswers    = errors.New("invalid_quiz_answers")
	ErrInvalidWritingData    = errors.New("invalid_writing_data")
	ErrInvalidSortBy         = errors.New("invalid_sort_by")
	ErrCharNotInList         = errors.New("character_not_in_list")
)
