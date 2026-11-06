package repository

import (
	"context"
	"database/sql"
	"freehongo-api/internal/quizes/models"
)

type QuizQueries struct {
	tx *sql.Tx
}

func NewListQueries(tx *sql.Tx) *QuizQueries { return &QuizQueries{tx: tx} }

func (q *QuizQueries) SubmitQuizSession(ctx context.Context, req models.SubmitQuizRequest) error

func (q *QuizQueries) FetchUserQuizSessions(ctx context.Context, req models.FetchUserQuizSessionsRequest) (models.QuizSessionsGroup, error)

func (q *QuizQueries) FetchQuizSessionDetail(ctx context.Context, req models.FetchQuizSessionDetailRequest) (models.QuizSessionDetail, error)

func (q *QuizQueries) FetchCharacterStats(ctx context.Context, req models.FetchCharacterStatsRequest) (models.CharacterStatsGroup, error)

func (q *QuizQueries) FetchListStats(ctx context.Context, req models.FetchListStatsRequest) (models.ListStats, error)

func (q *QuizQueries) FetchWeakCharacters(ctx context.Context, req models.FetchWeakCharactersRequest) (models.CharacterStatsGroup, error)
