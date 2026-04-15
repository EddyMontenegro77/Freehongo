package handlers

import (
	"database/sql"
	"fmt"
	"freehongo-api/internal/models"
	"freehongo-api/internal/repository"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

var allowedKanjiSortBy = map[string]struct{}{
	"literal":          {},
	"frequency_of_use": {},
	"jlpt_level":       {},
	"grade_level":      {},
}

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

// GetKanjiDisplay returns a paginated kanji list with optional filters and sorting.
func GetKanjiDisplay(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		offset, err := parseOffsetQuery(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		search, err := buildKanjiSearch(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		kanji, err := repository.GetKanjiDisplay(db, search, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}

		c.JSON(http.StatusOK, kanji)
	}
}

func GetKanjiWriting(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		unicode := c.Param("unicode")
		if unicode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unicode is required"})
			return
		}

		kanji, err := repository.GetKanjiWriting(db, unicode)
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

func buildKanjiSearch(c *gin.Context) (*models.KanjiSearch, error) {
	frequencyOfUse, err := parseOptionalIntQuery(c, "frequency_of_use")
	if err != nil {
		return nil, err
	}
	jlptLevel, err := parseOptionalIntQuery(c, "jlpt_level")
	if err != nil {
		return nil, err
	}
	gradeLevel, err := parseOptionalGradeLevelQuery(c, "grade_level")
	if err != nil {
		return nil, err
	}
	sortBy, err := parseOptionalEnumQuery(c, "sort_by", allowedKanjiSortBy)
	if err != nil {
		return nil, err
	}

	return &models.KanjiSearch{
		Unicode:        c.Query("unicode"),
		Literal:        c.Query("literal"),
		RadicalName:    c.Query("radical_name"),
		FrequencyOfUse: frequencyOfUse,
		JlptLevel:      jlptLevel,
		GradeLevel:     gradeLevel,
		Reading:        c.Query("reading"),
		Meaning:        c.Query("meaning"),
		Nanori:         c.Query("nanori"),
		SortBy:         sortBy,
	}, nil
}
