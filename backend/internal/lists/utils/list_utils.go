package utils

import (
	"errors"
	"freehongo-api/internal/lists/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleListError(c *gin.Context, err error) {
	switch{
		case errors.Is(err, models.ErrBadRequest):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "bad_request",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "internal_server_error",
			})
	}
}