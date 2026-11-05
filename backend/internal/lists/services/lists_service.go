package services

import (
	"context"
	"database/sql"
	"freehongo-api/internal/db"
	"freehongo-api/internal/lists/models"
	"freehongo-api/internal/lists/repository"
	"strings"
	"unicode/utf8"
)

type ListService struct{
	txm *db.TxManager
}

func NewListService(txm *db.TxManager) *ListService { return &ListService{txm: txm}}

func (s *ListService) FetchListInfo(ctx context.Context, req models.FetchListInfoRequest) (models.ListInfo, error) {
}

func (s *ListService) FetchUserLists(ctx context.Context, req models.FetchUserListsRequest) (models.ListsGroup, error) {}

func (s *ListService) CreateList(ctx context.Context, req models.CreateListRequest) error {
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" || utf8.RuneCountInString(req.Name) > 100 {
		return models.ErrBadRequest
	}
	return s.txm.InTx(ctx, req.UserId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)
		return lq.CreateList(ctx, req)
	})
}

func (s *ListService) DeleteList(ctx context.Context, req models.DeleteListRequest) (error) {}

func (s *ListService) UpdateList(ctx context.Context, req models.UpdateListRequest) (error) {}

func (s *ListService) FetchListCharacters(ctx context.Context, req models.FetchListCharactersRequest) (models.ListCharacters, error) {}

func (s *ListService) AddListCharacters(ctx context.Context, req models.AddListCharsRequest) (error) {}

func (s *ListService) DeleteListCharacters(ctx context.Context, req models.DeleteListCharsRequest) (error) {}

func (s *ListService) UpdateListCharacters(ctx context.Context, req models.UpdateListCharsRequest) (error) {}