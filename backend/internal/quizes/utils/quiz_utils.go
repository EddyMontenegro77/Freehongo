package utils

import (
	"errors"
	"freehongo-api/internal/quizes/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleQuizError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, models.ErrConflict):
		c.JSON(http.StatusConflict, gin.H{
			"error": "list_id_already_in_use",
		})

	case errors.Is(err, models.ErrBadRequest):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "bad_request",
		})

	case errors.Is(err, models.ErrInvalidQuizType):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid_list_type",
		})

	case errors.Is(err, models.ErrInvalidQuizLimit):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid_list_limit",
		})

	case errors.Is(err, models.ErrQuizNotFound):
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