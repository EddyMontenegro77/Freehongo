package services

import (
	"context"
	"database/sql"
	"errors"
	"freehongo-api/internal/db"
	dbErrors "freehongo-api/internal/db/errors"
	"freehongo-api/internal/lists/models"
	"freehongo-api/internal/lists/repository"
	"freehongo-api/internal/lists/utils"
	"strings"
	"time"
	"unicode/utf8"
)

const (
	maxListNameRunes = 100
	sampleCharsLimit = 5
	defaultPageLimit = 20
)


var minCreatedAt = time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)

type ListService struct {
	txm *db.TxManager
	systemUserID string
}

func NewListService(txm *db.TxManager) *ListService { return &ListService{txm: txm} }

func validateListFields(name, listType string) (string, string, error) {
	name = strings.TrimSpace(name)
	if name == "" || utf8.RuneCountInString(name) > maxListNameRunes {
		return "", "", models.ErrInvalidListName
	}
	lt, ok := models.ParseListType(listType)
	if !ok {
		return "", "", models.ErrInvalidListType
	}
	return name, string(lt), nil
}

func (s *ListService) FetchPublicListDetail(ctx context.Context, userId string, req models.FetchListRequest) (models.ListInfo, error) {
	return s.fetchPublicDetail(ctx, userId, req, nil)
}

func (s *ListService) FetchPublicListsPreview(ctx context.Context, userId string, req models.FetchPublicListsRequest) (models.ListsGroup, error) {
	return s.fetchPublicPreview(ctx, userId, req, nil)
}

func (s *ListService) FetchOfficialListDetail(ctx context.Context, userId string, req models.FetchListRequest) (models.ListInfo, error) {
	owner := s.systemUserID
	return s.fetchPublicDetail(ctx, userId, req, &owner)
}

func (s *ListService) FetchOfficialListsPreview(ctx context.Context, userId string, req models.FetchPublicListsRequest) (models.ListsGroup, error) {
	owner := s.systemUserID
	return s.fetchPublicPreview(ctx, userId, req, &owner)
}

func (s *ListService) fetchPublicDetail(ctx context.Context, userId string, req models.FetchListRequest, ownerID *string) (models.ListInfo, error) {
	var result models.ListInfo
	err := s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		var err error
		lq := repository.NewListQueries(tx)
		result, err = lq.FetchPublicList(ctx, req, ownerID, nil)
		return err
	})
	if err != nil {
		return models.ListInfo{}, utils.MapDBError(err)
	}
	return result, nil
}

func (s *ListService) fetchPublicPreview(ctx context.Context, userId string, req models.FetchPublicListsRequest, ownerID *string) (models.ListsGroup, error) {
	lt, err := utils.NormalizeListType(req.ListType)
	if err != nil {
		return models.ListsGroup{}, err
	}
	req.ListType = lt

	pageLimit := defaultPageLimit
	if req.Limit != nil {
		pageLimit = *req.Limit
	}

	var result models.ListsGroup
	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		var err error
		lq := repository.NewListQueries(tx)
		result, err = lq.FetchPublicLists(ctx, req, ownerID, pageLimit, sampleCharsLimit)
		return err
	})
	if err != nil {
		return models.ListsGroup{}, utils.MapDBError(err)
	}
	return result, nil
}

func (s *ListService) FetchListPreview(ctx context.Context, userId string, req models.FetchListRequest) (models.ListInfo, error) {
	charsLimit := sampleCharsLimit

	var result models.ListInfo
	err := s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)

		var err error
		result, err = lq.FetchList(ctx, req, &charsLimit)
		return err
	})
	if err != nil {
		return models.ListInfo{}, utils.MapDBError(err)
	}

	return result, nil
}

func (s *ListService) FetchListDetail(ctx context.Context, userId string, req models.FetchListRequest) (models.ListInfo, error) {
	var result models.ListInfo
	err := s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)

		var err error
		result, err = lq.FetchList(ctx, req, nil)
		return err
	})
	if err != nil {
		return models.ListInfo{}, utils.MapDBError(err)
	}

	return result, nil
}

func (s *ListService) FetchUserLists(ctx context.Context, userId string, req models.FetchUserListsRequest) (models.ListsGroup, error) {
	var err error
	req.ListType, err = utils.NormalizeListType(req.ListType)
	if err != nil {
		return models.ListsGroup{}, err
	}

	var charLimit *int
	if req.Full == nil || !*req.Full {
		limit := sampleCharsLimit
		charLimit = &limit
	}

	var result models.ListsGroup
	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)

		var err error
		result, err = lq.FetchUserLists(ctx, req, req.Limit, charLimit, userId)
		return err
	})
	if err != nil {
		return models.ListsGroup{}, utils.MapDBError(err)
	}

	return result, nil
}

func (s *ListService) CreateList(ctx context.Context, userId string, req models.CreateListRequest) error {
	name, listType, err := validateListFields(req.Name, req.ListType)
	if err != nil {
		return err
	}
	req.Name = name
	req.ListType = listType

	now := time.Now().UTC()
	req.CreatedAt = req.CreatedAt.UTC()
	if req.CreatedAt.After(now) || req.CreatedAt.Before(minCreatedAt) {
		req.CreatedAt = now
	}

	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)

		created, err := lq.CreateList(ctx, req, userId)
		if err != nil {
			return err
		}
		if created {
			return nil
		}

		owns, err := lq.OwnsList(ctx, req.ListId, userId)
		if err != nil {
			return err
		}
		if !owns {
			return dbErrors.ErrConflict
		}
		return nil
	})
	return utils.MapDBError(err)
}

func (s *ListService) DeleteList(ctx context.Context, userId string, req models.DeleteListRequest) error {
	err := s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)
		return lq.DeleteList(ctx, req)
	})
	if errors.Is(err, dbErrors.ErrNoRowsChanged) {
		return nil
	}
	return utils.MapDBError(err)
}

func (s *ListService) UpdateList(ctx context.Context, userId string, req models.UpdateListRequest) error {
	name, listType, err := validateListFields(req.Name, req.ListType)
	if err != nil {
		return err
	}
	req.Name = name
	req.ListType = listType

	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)
		return lq.UpdateList(ctx, req)
	})
	return utils.MapDBError(err)
}

func (s *ListService) AddListCharacters(ctx context.Context, userId string, req models.AddListCharsRequest) error {
	chars, err := utils.NormalizeChars(req.CharUnicodes)
	if err != nil {
		return err
	}
	req.CharUnicodes = chars

	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)
		return lq.AddListCharacters(ctx, req)
	})
	return utils.MapDBError(err)
}

func (s *ListService) DeleteListCharacters(ctx context.Context, userId string, req models.DeleteListCharsRequest) error {
	chars, err := utils.NormalizeChars(req.CharUnicodes)
	if err != nil {
		return err
	}
	req.CharUnicodes = chars

	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)
		return lq.DeleteListCharacters(ctx, req)
	})
	if errors.Is(err, dbErrors.ErrNoRowsChanged) {
		return nil
	}
	return utils.MapDBError(err)
}

func (s *ListService) UpdateListCharacters(ctx context.Context, userId string, req models.UpdateListCharsRequest) error {
	chars, err := utils.NormalizeChars(req.CharUnicodes)
	if err != nil {
		return err
	}
	req.CharUnicodes = chars

	err = s.txm.InTx(ctx, userId, func(tx *sql.Tx) error {
		lq := repository.NewListQueries(tx)
		return lq.UpdateListCharacters(ctx, req)
	})
	return utils.MapDBError(err)
}