package models

import (
	"encoding/json"
	"strings"
	"time"
)

type AnswerType string

const (
	AnswerMultiple      AnswerType = "multiple"
	AnswerOpen          AnswerType = "open"
	AnswerStrokeWriting AnswerType = "strokeWriting"
)

func ParseAnswerType(s string) (AnswerType, bool) {
	t := AnswerType(strings.TrimSpace(s))
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

type SubmitQuizRequest struct {
	QuizSessionId     string            `json:"quizSessionId" binding:"required,uuid"`
	ListId            string            `json:"listId" binding:"required,uuid"`
	AnswerType        string            `json:"answerType" binding:"required"`
	CharacterQuizType *string            `json:"characterQuizType"`
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
	Writing        *WritingAttemptInput `json:"writing"`
}

type WritingAttemptInput struct {
	StrokeCountCorrect *bool           `json:"strokeCountCorrect" binding:"required"`
	OrderCorrect       *bool           `json:"orderCorrect" binding:"required"`
	StrokeResults      json.RawMessage `json:"strokeResults" binding:"required"`
}

type FetchUserQuizSessionsRequest struct {
	ListId     *string    `form:"listId" binding:"omitempty,uuid"`
	AnswerType *string    `form:"answerType"`
	From       *time.Time `form:"from"`
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

type QuizSessionSummary struct {
	QuizSessionId     string    `json:"quizSessionId"`
	ListId            string    `json:"listId"`
	ListName          *string   `json:"listName"`
	AnswerType        string    `json:"answerType"`
	CharacterQuizType *string    `json:"characterQuizType"`
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
	Accuracy      float64   `json:"accuracy"`
	AvgResponseMs float64   `json:"avgResponseMs"`
	FirstSeenAt   time.Time `json:"firstSeenAt"`
	LastSeenAt    time.Time `json:"lastSeenAt"`
}

type CharacterStatsGroup struct {
	Stats []CharacterStat `json:"stats"`
}

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