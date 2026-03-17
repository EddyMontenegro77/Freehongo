package handlers

import (
	"database/sql"
	"fmt"
	"freehongo-api/internal/repository"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func GetKanji(db *sql.DB) gin.HandlerFunc {
		return func(c *gin.Context) {
		unicode := c.Param("unicode")

		kanji, err := repository.GetKanji(db, unicode)
		if err != nil {
			if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "kanji not found"})
			return 
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}

		c.JSON(http.StatusOK, kanji)
	}
}

func GetKanjiSVG() gin.HandlerFunc {
    return func(c *gin.Context) {
        unicode := c.Param("unicode")
        url := fmt.Sprintf("%s/storage/v1/object/public/japanese-characters/kanji/%s.svg",
            os.Getenv("SUPABASE_URL"), unicode)
        c.JSON(http.StatusOK, gin.H{"url": url})
    }
}