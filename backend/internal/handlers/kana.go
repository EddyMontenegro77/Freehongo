package handlers

import (
	"database/sql"
	"fmt"
	"freehongo-api/internal/repository"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func GetKana(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		unicode := c.Param("unicode")

		kana, err := repository.GetKana(db, unicode)
		if err != nil {
			if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "kana not found"})
			return 
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}

		c.JSON(http.StatusOK, kana)
	}
}

func GetKanaSVG() gin.HandlerFunc {
    return func(c *gin.Context) {
        unicode := c.Param("unicode")
        url := fmt.Sprintf("%s/storage/v1/object/public/japanese-characters/kana/%s.svg",
            os.Getenv("SUPABASE_URL"), unicode)
        c.JSON(http.StatusOK, gin.H{"url": url})
    }
}