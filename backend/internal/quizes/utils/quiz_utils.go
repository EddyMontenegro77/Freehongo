package utils

import (
	"database/sql"
	"encoding/json"
	"errors"
	dbErrors "freehongo-api/internal/db/errors"
	"freehongo-api/internal/quizes/models"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
)

const (
	defaultPageLimit   = 20
	maxOffset          = 10000
	minAnswers         = 2
	maxAnswers         = 500
	maxResponseTimeMs  = 3_600_000
	maxSessionDuration = 24 * time.Hour
	maxClockSkew       = 5 * time.Minute
	answerTimeSlack    = time.Minute
	maxUnicodeLen      = 32
	maxAnswerTextRunes = 200
	maxStrokeJSONBytes = 64 * 1024

	defaultWeakMinAttempts = 3
)

var minQuizDate = time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)

func NormalizeAnswerType(s *string) (*string, error) {
	if s == nil {
		return nil, nil
	}
	t, ok := models.ParseAnswerType(*s)
	if !ok {
		return nil, models.ErrInvalidAnswerType
	}
	v := string(t)
	return &v, nil
}

func ResolveLimit(limit *int) int {
	if limit == nil {
		return defaultPageLimit
	}
	return *limit
}

func ValidateOffset(offset int) error {
	if offset < 0 || offset > maxOffset {
		return models.ErrBadRequest
	}
	return nil
}

func ValidateAnswerText(s *string) error {
	if s != nil && utf8.RuneCountInString(*s) > maxAnswerTextRunes {
		return models.ErrInvalidQuizAnswers
	}
	return nil
}

func ValidateSubmit(req models.SubmitQuizRequest) (models.SubmitQuizRequest, []string, error) {
	at, ok := models.ParseAnswerType(req.AnswerType)
	if !ok {
		return req, nil, models.ErrInvalidAnswerType
	}
	cqt, ok := models.ParseCharacterQuizType(req.CharacterQuizType)
	if !ok {
		return req, nil, models.ErrInvalidCharQuizType
	}
	if at == models.AnswerStrokeWriting && !cqt.AllowsStrokeWriting() {
		return req, nil, models.ErrInvalidCharQuizType
	}
	req.AnswerType = string(at)
	req.CharacterQuizType = string(cqt)

	req.StartedAt = req.StartedAt.UTC()
	req.FinishedAt = req.FinishedAt.UTC()
	now := time.Now().UTC()

	if req.StartedAt.Before(minQuizDate) ||
		req.FinishedAt.Before(req.StartedAt) ||
		req.FinishedAt.After(now.Add(maxClockSkew)) ||
		req.FinishedAt.Sub(req.StartedAt) > maxSessionDuration {
		return req, nil, models.ErrInvalidQuizTimes
	}

	if len(req.Answers) < minAnswers || len(req.Answers) > maxAnswers {
		return req, nil, models.ErrInvalidQuizAnswers
	}

	answers := make([]models.QuizAnswerInput, len(req.Answers))
	seen := make(map[string]struct{}, len(req.Answers))
	chars := make([]string, 0, len(req.Answers))
	lowerBound := req.StartedAt.Add(-answerTimeSlack)
	upperBound := req.FinishedAt.Add(answerTimeSlack)

	for i, a := range req.Answers {
		a.Unicode = strings.TrimSpace(a.Unicode)
		if a.Unicode == "" || len(a.Unicode) > maxUnicodeLen {
			return req, nil, models.ErrInvalidQuizAnswers
		}
		if _, dup := seen[a.Unicode]; dup {
			return req, nil, models.ErrInvalidQuizAnswers
		}
		seen[a.Unicode] = struct{}{}
		chars = append(chars, a.Unicode)

		if a.IsCorrect == nil || a.ResponseTimeMs < 0 || a.ResponseTimeMs > maxResponseTimeMs {
			return req, nil, models.ErrInvalidQuizAnswers
		}
		if err := ValidateAnswerText(a.GivenAnswer); err != nil {
			return req, nil, err
		}
		if err := ValidateAnswerText(a.ExpectedAnswer); err != nil {
			return req, nil, err
		}
		if err := ValidateAnswerText(a.ConfusedWith); err != nil {
			return req, nil, err
		}

		if a.AnsweredAt != nil {
			t := a.AnsweredAt.UTC()
			if t.Before(lowerBound) || t.After(upperBound) {
				return req, nil, models.ErrInvalidQuizTimes
			}
			a.AnsweredAt = &t
		}

		if at == models.AnswerStrokeWriting {
			w := a.Writing
			if w == nil || w.StrokeCountCorrect == nil || w.OrderCorrect == nil ||
				len(w.StrokeResults) == 0 || len(w.StrokeResults) > maxStrokeJSONBytes ||
				!json.Valid(w.StrokeResults) {
				return req, nil, models.ErrInvalidWritingData
			}
		} else if a.Writing != nil {
			return req, nil, models.ErrInvalidWritingData
		}

		answers[i] = a
	}
	req.Answers = answers

	return req, chars, nil
}

func HandleQuizError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, dbErrors.ErrConflict):
		c.JSON(http.StatusConflict, gin.H{"error": "quiz_session_id_already_in_use"})

	case errors.Is(err, models.ErrBadRequest):
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad_request"})

	case errors.Is(err, models.ErrInvalidAnswerType):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_answer_type"})

	case errors.Is(err, models.ErrInvalidCharQuizType):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_character_quiz_type"})

	case errors.Is(err, models.ErrInvalidQuizTimes):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_quiz_times"})

	case errors.Is(err, models.ErrInvalidQuizAnswers):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_quiz_answers"})

	case errors.Is(err, models.ErrInvalidWritingData):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_writing_data"})

	case errors.Is(err, models.ErrInvalidSortBy):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_sort_by"})

	case errors.Is(err, models.ErrCharNotInList):
		c.JSON(http.StatusBadRequest, gin.H{"error": "character_not_in_list"})

	case errors.Is(err, models.ErrQuizNotFound), errors.Is(err, sql.ErrNoRows):
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})

	case errors.Is(err, models.ErrRLSPolicyViolation):
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})

	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_server_error"})
	}
}