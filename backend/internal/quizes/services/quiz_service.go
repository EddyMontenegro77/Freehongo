package services

import (
	"context"
	"database/sql"
	"strings"

	"freehongo-api/internal/db"
	dbErrors "freehongo-api/internal/db/errors"
	"freehongo-api/internal/quizes/models"
	"freehongo-api/internal/quizes/repository"
	"freehongo-api/internal/quizes/utils"
)

const (
	maxUnicodeLen      = 32
	defaultWeakMinAttempts = 3
)

type QuizService struct {
	txm *db.TxManager
}

func NewQuizService(txm *db.TxManager) *QuizService { return &QuizService{txm: txm} }

func (s *QuizService) SubmitQuizSession(ctx context.Context, userId string, req models.SubmitQuizRequest) error {
	req, _, err := utils.ValidateSubmit(req)
	if err != nil {
		return err
	}

	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		qq := repository.NewQuizQueries(tx)

		owns, err := qq.OwnsQuizSession(ctx, req.QuizSessionId, userId)
		if err != nil {
			return err
		}
		if owns {
			return nil
		}

		accessible, err := qq.ListAccessible(ctx, req.ListId, req.StartedAt)
		if err != nil {
			return err
		}
		if !accessible {
			return sql.ErrNoRows
		}

		created, err := qq.SubmitQuizSession(ctx, userId, req)
		if err != nil {
			return err
		}
		if created {
			return nil
		}

		owns, err = qq.OwnsQuizSession(ctx, req.QuizSessionId, userId)
		if err != nil {
			return err
		}
		if !owns {
			return dbErrors.ErrConflict
		}
		return nil
	})
	return dbErrors.MapDBError(err)
}


func (s *QuizService) FetchUserQuizSessions(ctx context.Context, userId string, req models.FetchUserQuizSessionsRequest) (models.QuizSessionsGroup, error) {
	var err error
	if req.AnswerType, err = utils.NormalizeAnswerType(req.AnswerType); err != nil {
		return models.QuizSessionsGroup{}, err
	}
	if err := utils.ValidateOffset(req.Offset); err != nil {
		return models.QuizSessionsGroup{}, err
	}
	if req.From != nil && req.To != nil && req.From.After(*req.To) {
		return models.QuizSessionsGroup{}, models.ErrInvalidQuizTimes
	}
	pageLimit := utils.ResolveLimit(req.Limit)

	var result models.QuizSessionsGroup
	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		qq := repository.NewQuizQueries(tx)

		var err error
		result, err = qq.FetchUserQuizSessions(ctx, userId, req, pageLimit)
		return err
	})
	if err != nil {
		return models.QuizSessionsGroup{}, dbErrors.MapDBError(err)
	}
	return result, nil
}

func (s *QuizService) FetchQuizSessionDetail(ctx context.Context, userId string, req models.FetchQuizSessionDetailRequest) (models.QuizSessionDetail, error) {
	var result models.QuizSessionDetail
	err := s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		qq := repository.NewQuizQueries(tx)

		var err error
		result, err = qq.FetchQuizSessionDetail(ctx, userId, req)
		return err
	})
	if err != nil {
		return models.QuizSessionDetail{}, dbErrors.MapDBError(err)
	}
	return result, nil
}

func (s *QuizService) FetchCharacterStats(ctx context.Context, userId string, req models.FetchCharacterStatsRequest) (models.CharacterStatsGroup, error) {
	var err error
	if req.AnswerType, err = utils.NormalizeAnswerType(req.AnswerType); err != nil {
		return models.CharacterStatsGroup{}, err
	}
	if err := utils.ValidateOffset(req.Offset); err != nil {
		return models.CharacterStatsGroup{}, err
	}
	if req.Unicode != nil {
		u := strings.TrimSpace(*req.Unicode)
		if u == "" || len(u) > maxUnicodeLen {
			return models.CharacterStatsGroup{}, models.ErrBadRequest
		}
		req.Unicode = &u
	}
	pageLimit := utils.ResolveLimit(req.Limit)

	var result models.CharacterStatsGroup
	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		qq := repository.NewQuizQueries(tx)

		var err error
		result, err = qq.FetchCharacterStats(ctx, userId, req, pageLimit)
		return err
	})
	if err != nil {
		return models.CharacterStatsGroup{}, dbErrors.MapDBError(err)
	}
	return result, nil
}

func (s *QuizService) FetchListStats(ctx context.Context, userId string, req models.FetchListStatsRequest) (models.ListStats, error) {
	var err error
	if req.AnswerType, err = utils.NormalizeAnswerType(req.AnswerType); err != nil {
		return models.ListStats{}, err
	}

	var result models.ListStats
	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		qq := repository.NewQuizQueries(tx)

		var err error
		result, err = qq.FetchListStats(ctx, userId, req)
		return err
	})
	if err != nil {
		return models.ListStats{}, dbErrors.MapDBError(err)
	}
	return result, nil
}

func (s *QuizService) FetchWeakCharacters(ctx context.Context, userId string, req models.FetchWeakCharactersRequest) (models.CharacterStatsGroup, error) {
	var err error
	if req.AnswerType, err = utils.NormalizeAnswerType(req.AnswerType); err != nil {
		return models.CharacterStatsGroup{}, err
	}

	sortBy := models.WeakByAccuracy
	if req.SortBy != nil {
		parsed, ok := models.ParseWeakSortBy(*req.SortBy)
		if !ok {
			return models.CharacterStatsGroup{}, models.ErrInvalidSortBy
		}
		sortBy = parsed
	}

	minAttempts := defaultWeakMinAttempts
	if req.MinAttempts != nil {
		minAttempts = *req.MinAttempts
	}
	limit := utils.ResolveLimit(req.Limit)

	var result models.CharacterStatsGroup
	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		qq := repository.NewQuizQueries(tx)

		var err error
		result, err = qq.FetchWeakCharacters(ctx, userId, req, sortBy, minAttempts, limit)
		return err
	})
	if err != nil {
		return models.CharacterStatsGroup{}, dbErrors.MapDBError(err)
	}
	return result, nil
}