package utils

import (
	"database/sql"
	"errors"
	"freehongo-api/internal/lists/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
)

func HandleListError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, models.ErrConflict):
		c.JSON(http.StatusConflict, gin.H{
			"error": "list_id_already_in_use",
		})

	case errors.Is(err, models.ErrBadRequest):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "bad_request",
		})

	case errors.Is(err, models.ErrInvalidListType):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid_list_type",
		})

	case errors.Is(err, models.ErrInvalidListName):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid_list_name",
		})

	case errors.Is(err, models.ErrInvalidListLimit):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid_list_limit",
		})

	case errors.Is(err, models.ErrListNotFound):
		c.JSON(http.StatusNotFound, gin.H{
			"error": "list_not_found",
		})

	case errors.Is(err, models.ErrInvalidChars):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid_chars",
		})

	case errors.Is(err, models.ErrNoRowsChanged):
		c.JSON(http.StatusOK, gin.H{
			"message": "no_changes_made",
		})

	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_server_error",
		})
	}
}

func NormalizeListType(lt *string) (*string, error) {
	if lt == nil {
		return nil, nil
	}
	parsed, ok := models.ParseListType(*lt)
	if !ok {
		return nil, models.ErrInvalidListType
	}
	v := string(parsed)
	return &v, nil
}

func MapDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, sql.ErrNoRows) || errors.Is(err, models.ErrNoRowsChanged) {
		return models.ErrListNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "42501": // RLS
			return models.ErrListNotFound
		case "23503": // FK
			return models.ErrInvalidChars
		}
	}
	return err
}