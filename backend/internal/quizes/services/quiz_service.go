package services

import (
	"context"
	"freehongo-api/internal/db"
	"freehongo-api/internal/quizes/models"
)

type QuizService struct {
	txm *db.TxManager
}

func NewQuizService(txm *db.TxManager) *QuizService { return &QuizService{txm: txm} }

func (q *QuizService) SubmitQuizSession(ctx context.Context, userId string, req models.SubmitQuizRequest) error

func (q *QuizService) FetchUserQuizSessions(ctx context.Context, userId string, req models.FetchUserQuizSessionsRequest) (models.QuizSessionsGroup, error)

func (q *QuizService) FetchQuizSessionDetail(ctx context.Context, userId string, req models.FetchQuizSessionDetailRequest) (models.QuizSessionDetail, error)

func (q *QuizService) FetchCharacterStats(ctx context.Context, userId string, req models.FetchCharacterStatsRequest) (models.CharacterStatsGroup, error)

func (q *QuizService) FetchListStats(ctx context.Context, userId string, req models.FetchListStatsRequest) (models.ListStats, error)

func (q *QuizService) FetchWeakCharacters(ctx context.Context, userId string, req models.FetchWeakCharactersRequest) (models.CharacterStatsGroup, error)
