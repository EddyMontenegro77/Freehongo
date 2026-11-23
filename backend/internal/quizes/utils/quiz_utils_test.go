package utils

import (
	"errors"
	"testing"
	"time"

	"freehongo-api/internal/quizes/models"
)

func validSubmitRequest(answerType string) models.SubmitQuizRequest {
	now := time.Now().UTC().Truncate(time.Millisecond)
	correct := true
	return models.SubmitQuizRequest{
		AnswerType: answerType,
		StartedAt:  now.Add(-time.Minute),
		FinishedAt: now,
		Answers: []models.QuizAnswerInput{
			{Unicode: " 3042 ", ResponseTimeMs: 500, IsCorrect: &correct},
			{Unicode: "3044", ResponseTimeMs: 700, IsCorrect: &correct},
		},
	}
}

func TestValidateSubmitNormalizesAnswersAndReturnsCharacters(t *testing.T) {
	req := validSubmitRequest(string(models.AnswerOpen))

	got, chars, err := ValidateSubmit(req)

	if err != nil {
		t.Fatalf("ValidateSubmit() error = %v", err)
	}
	if got.AnswerType != string(models.AnswerOpen) {
		t.Fatalf("AnswerType = %q; want %q", got.AnswerType, models.AnswerOpen)
	}
	if got.Answers[0].Unicode != "3042" {
		t.Fatalf("first unicode = %q; want 3042", got.Answers[0].Unicode)
	}
	if len(chars) != 2 || chars[0] != "3042" || chars[1] != "3044" {
		t.Fatalf("characters = %#v; want [3042 3044]", chars)
	}
}

func TestValidateSubmitRejectsDuplicateCharacters(t *testing.T) {
	req := validSubmitRequest(string(models.AnswerOpen))
	req.Answers[1].Unicode = "3042"

	if _, _, err := ValidateSubmit(req); !errors.Is(err, models.ErrInvalidQuizAnswers) {
		t.Fatalf("ValidateSubmit() error = %v; want ErrInvalidQuizAnswers", err)
	}
}

func TestValidateSubmitRejectsInvalidTimesAndAnswerType(t *testing.T) {
	req := validSubmitRequest("invalid")
	if _, _, err := ValidateSubmit(req); !errors.Is(err, models.ErrInvalidAnswerType) {
		t.Fatalf("invalid answer type error = %v; want ErrInvalidAnswerType", err)
	}

	req = validSubmitRequest(string(models.AnswerOpen))
	req.FinishedAt = req.StartedAt.Add(-time.Second)
	if _, _, err := ValidateSubmit(req); !errors.Is(err, models.ErrInvalidQuizTimes) {
		t.Fatalf("invalid times error = %v; want ErrInvalidQuizTimes", err)
	}
}

func TestValidateSubmitRequiresValidWritingData(t *testing.T) {
	req := validSubmitRequest(string(models.AnswerStrokeWriting))

	if _, _, err := ValidateSubmit(req); !errors.Is(err, models.ErrInvalidWritingData) {
		t.Fatalf("missing writing data error = %v; want ErrInvalidWritingData", err)
	}

	strokeCount, orderCorrect := true, false
	for i := range req.Answers {
		req.Answers[i].Writing = &models.WritingAttemptInput{
			StrokeCountCorrect: &strokeCount,
			OrderCorrect:       &orderCorrect,
			StrokeResults:      []byte(`[]`),
		}
	}
	if _, _, err := ValidateSubmit(req); err != nil {
		t.Fatalf("valid writing data error = %v", err)
	}
}

func TestValidateOffsetAndResolveLimit(t *testing.T) {
	if err := ValidateOffset(-1); !errors.Is(err, models.ErrBadRequest) {
		t.Fatalf("negative offset error = %v; want ErrBadRequest", err)
	}
	if err := ValidateOffset(10000); err != nil {
		t.Fatalf("maximum offset error = %v; want nil", err)
	}
	if ResolveLimit(nil) != 20 {
		t.Fatalf("ResolveLimit(nil) = %d; want 20", ResolveLimit(nil))
	}
}
