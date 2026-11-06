package models

import (
	"encoding/json"
	"errors"
	"strings"
	"time"
)

// ---------- Enums ----------

type AnswerType string

const (
	AnswerMultiple      AnswerType = "multiple"
	AnswerOpen          AnswerType = "open"
	AnswerStrokeWriting AnswerType = "strokeWriting"
)

func ParseAnswerType(s string) (AnswerType, bool) {
	t := AnswerType(strings.TrimSpace(s)) // sin ToLower: "strokeWriting" es camelCase
	switch t {
	case AnswerMultiple, AnswerOpen, AnswerStrokeWriting:
		return t, true
	}
	return "", false
}

type CharacterQuizType string

const (
	CharacterToReading CharacterQuizType = "characterToReading"
	ReadingToCharacter CharacterQuizType = "readingToCharacter"
	CharacterToMeaning CharacterQuizType = "characterToMeaning"
	MeaningToCharacter CharacterQuizType = "meaningToCharacter"
)

func ParseCharacterQuizType(s string) (CharacterQuizType, bool) {
	t := CharacterQuizType(strings.TrimSpace(s))
	switch t {
	case CharacterToReading, ReadingToCharacter, CharacterToMeaning, MeaningToCharacter:
		return t, true
	}
	return "", false
}

// strokeWriting solo es válido con estos dos (igual que el CHECK de la tabla)
func (t CharacterQuizType) AllowsStrokeWriting() bool {
	return t == ReadingToCharacter || t == MeaningToCharacter
}

type WeakSortBy string

const (
	WeakByAccuracy WeakSortBy = "accuracy"
	WeakByStreak   WeakSortBy = "streak"
	WeakBySlowest  WeakSortBy = "slowest"
)

func ParseWeakSortBy(s string) (WeakSortBy, bool) {
	t := WeakSortBy(strings.ToLower(strings.TrimSpace(s)))
	switch t {
	case WeakByAccuracy, WeakByStreak, WeakBySlowest:
		return t, true
	}
	return "", false
}

// ---------- Errores nuevos (mapéalos a 400 en HandleListError / el equivalente de quiz) ----------

var (
	ErrInvalidAnswerType     = errors.New("invalid_answer_type")
	ErrInvalidCharQuizType   = errors.New("invalid_character_quiz_type")
	ErrInvalidQuizTimes      = errors.New("invalid_quiz_times")
	ErrInvalidQuizAnswers    = errors.New("invalid_quiz_answers")
	ErrInvalidWritingData    = errors.New("invalid_writing_data")
	ErrInvalidSortBy         = errors.New("invalid_sort_by")
	ErrCharNotInList         = errors.New("character_not_in_list")
)

// ---------- Requests: escritura ----------

type SubmitQuizRequest struct {
	QuizSessionId     string            `json:"quizSessionId" binding:"required,uuid"`
	ListId            string            `json:"listId" binding:"required,uuid"`
	AnswerType        string            `json:"answerType" binding:"required"`
	CharacterQuizType string            `json:"characterQuizType" binding:"required"`
	StartedAt         time.Time         `json:"startedAt" binding:"required"`
	FinishedAt        time.Time         `json:"finishedAt" binding:"required"`
	RandomOrder       *bool             `json:"randomOrder" binding:"required"`
	Answers           []QuizAnswerInput `json:"answers" binding:"required,min=2,max=500,dive"`
}

type QuizAnswerInput struct {
	Unicode        string               `json:"unicode" binding:"required"`
	ResponseTimeMs int                  `json:"responseTimeMs" binding:"gte=0"`
	IsCorrect      *bool                `json:"isCorrect" binding:"required"`
	GivenAnswer    *string              `json:"givenAnswer"`
	ExpectedAnswer *string              `json:"expectedAnswer"`
	ConfusedWith   *string              `json:"confusedWith"`
	AnsweredAt     *time.Time           `json:"answeredAt"`
	Writing        *WritingAttemptInput `json:"writing"` // solo con answerType = strokeWriting
}

type WritingAttemptInput struct {
	StrokeCountCorrect *bool           `json:"strokeCountCorrect" binding:"required"`
	OrderCorrect       *bool           `json:"orderCorrect" binding:"required"`
	StrokeResults      json.RawMessage `json:"strokeResults" binding:"required"`
}

// ---------- Requests: lectura ----------

type FetchUserQuizSessionsRequest struct {
	ListId     *string    `form:"listId" binding:"omitempty,uuid"`
	AnswerType *string    `form:"answerType"`
	From       *time.Time `form:"from"` // RFC3339
	To         *time.Time `form:"to"`
	Limit      *int       `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset     int        `form:"offset" binding:"omitempty,min=0"`
}

type FetchQuizSessionDetailRequest struct {
	QuizSessionId string `form:"quizSessionId" binding:"required,uuid"`
}

type FetchCharacterStatsRequest struct {
	AnswerType *string `form:"answerType"`
	Unicode    *string `form:"unicode"`
	Limit      *int    `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset     int     `form:"offset" binding:"omitempty,min=0"`
}

type FetchListStatsRequest struct {
	ListId     string  `form:"listId" binding:"required,uuid"`
	AnswerType *string `form:"answerType"`
}

type FetchWeakCharactersRequest struct {
	ListId      *string `form:"listId" binding:"omitempty,uuid"`
	AnswerType  *string `form:"answerType"`
	SortBy      *string `form:"sortBy"`
	MinAttempts *int    `form:"minAttempts" binding:"omitempty,min=1,max=100"`
	Limit       *int    `form:"limit" binding:"omitempty,min=1,max=100"`
}

// ---------- Responses ----------

type QuizSessionSummary struct {
	QuizSessionId     string    `json:"quizSessionId"`
	ListId            string    `json:"listId"`
	ListName          *string   `json:"listName"` // null si la lista ya no es visible
	AnswerType        string    `json:"answerType"`
	CharacterQuizType string    `json:"characterQuizType"`
	StartedAt         time.Time `json:"startedAt"`
	FinishedAt        time.Time `json:"finishedAt"`
	TotalQuestions    int       `json:"totalQuestions"`
	RandomOrder       bool      `json:"randomOrder"`
	CorrectCount      int       `json:"correctCount"`
	AvgResponseMs     float64   `json:"avgResponseMs"`
}

type QuizSessionsGroup struct {
	Sessions []QuizSessionSummary `json:"sessions"`
}

type QuizSessionDetail struct {
	QuizSessionSummary
	Answers []QuizAnswerDetail `json:"answers"`
}

type QuizAnswerDetail struct {
	Unicode        string                 `json:"unicode"`
	ResponseTimeMs int                    `json:"responseTimeMs"`
	IsCorrect      bool                   `json:"isCorrect"`
	GivenAnswer    *string                `json:"givenAnswer"`
	ExpectedAnswer *string                `json:"expectedAnswer"`
	ConfusedWith   *string                `json:"confusedWith"`
	AnsweredAt     *time.Time             `json:"answeredAt"`
	Writing        *WritingAttemptDetail  `json:"writing"`
}

type WritingAttemptDetail struct {
	StrokeCountCorrect bool            `json:"strokeCountCorrect"`
	OrderCorrect       bool            `json:"orderCorrect"`
	StrokeResults      json.RawMessage `json:"strokeResults"`
}

type CharacterStat struct {
	Unicode       string    `json:"unicode"`
	AnswerType    string    `json:"answerType"`
	Attempts      int       `json:"attempts"`
	CorrectCount  int       `json:"correctCount"`
	CorrectStreak int       `json:"correctStreak"`
	Accuracy      float64   `json:"accuracy"`      // 0..1
	AvgResponseMs float64   `json:"avgResponseMs"`
	FirstSeenAt   time.Time `json:"firstSeenAt"`
	LastSeenAt    time.Time `json:"lastSeenAt"`
}

type CharacterStatsGroup struct {
	Stats []CharacterStat `json:"stats"`
}

// Carácter de una lista con o sin práctica: los campos de stats son null si nunca se practicó
type ListCharacterStat struct {
	Unicode       string     `json:"unicode"`
	Attempts      int        `json:"attempts"`
	CorrectCount  int        `json:"correctCount"`
	CorrectStreak int        `json:"correctStreak"`
	Accuracy      *float64   `json:"accuracy"`
	AvgResponseMs *float64   `json:"avgResponseMs"`
	LastSeenAt    *time.Time `json:"lastSeenAt"`
}

type ListStats struct {
	ListId              string              `json:"listId"`
	TotalCharacters     int                 `json:"totalCharacters"`
	PracticedCharacters int                 `json:"practicedCharacters"`
	Characters          []ListCharacterStat `json:"characters"`
}