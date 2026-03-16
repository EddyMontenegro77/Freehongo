package handlers

import (
	"database/sql"
	"freehongo-api/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetKana(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		unicode := c.Param("unicode")

		kana, err := repository.GetKana(db, unicode)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "kana not found"})
			return 
		}

		c.JSON(http.StatusOK, kana)
	}
}