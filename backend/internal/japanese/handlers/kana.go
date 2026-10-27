package handlers

import (
	"database/sql"
	"fmt"
	"freehongo-api/internal/japanese/models"
	"freehongo-api/internal/japanese/repository"
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

// GetKanaDisplay returns a paginated kana list with the filters provided in the query string.
func GetKanaDisplay(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		offset, err := parseOffsetQuery(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		search := &models.KanaSearch{
			Unicode: c.Query("unicode"),
			Literal: c.Query("literal"),
			Type:    c.Query("type"),
			Reading: c.Query("reading"),
		}

		kana, err := repository.GetKanaDisplay(db, search, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}

		c.JSON(http.StatusOK, kana)
	}
}

func GetKanaWriting(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		unicode := c.Param("unicode")
		if unicode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unicode is required"})
			return
		}

		kana, err := repository.GetKanaWriting(db, unicode)
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
