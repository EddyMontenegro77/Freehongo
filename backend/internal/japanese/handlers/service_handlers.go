package handlers

import (
	"database/sql"
	"net/http"

	"freehongo-api/internal/japanese/models"
	"github.com/gin-gonic/gin"
)

type JapaneseService interface {
	GetKana(string) (*models.Kana, error)
	GetKanaWriting(string) (*models.KanaWriting, error)
	GetKanaDisplay(*models.KanaSearch, int) (*models.KanaDisplayPage, error)
	GetKanji(string) (*models.Kanji, error)
	GetKanjiWriting(string) (*models.KanjiWriting, error)
	GetKanjiDisplay(*models.KanjiSearch, int) (*models.KanjiDisplayPage, error)
}

type ServiceHandlers struct{ service JapaneseService }

func NewServiceHandlers(service JapaneseService) *ServiceHandlers {
	return &ServiceHandlers{service: service}
}

func GetKanaFromService(service JapaneseService) gin.HandlerFunc {
	return NewServiceHandlers(service).GetKana()
}

func GetKanaWritingFromService(service JapaneseService) gin.HandlerFunc {
	return NewServiceHandlers(service).GetKanaWriting()
}

func GetKanaDisplayFromService(service JapaneseService) gin.HandlerFunc {
	return NewServiceHandlers(service).GetKanaDisplay()
}

func GetKanjiFromService(service JapaneseService) gin.HandlerFunc {
	return NewServiceHandlers(service).GetKanji()
}

func GetKanjiWritingFromService(service JapaneseService) gin.HandlerFunc {
	return NewServiceHandlers(service).GetKanjiWriting()
}

func GetKanjiDisplayFromService(service JapaneseService) gin.HandlerFunc {
	return NewServiceHandlers(service).GetKanjiDisplay()
}

func (h *ServiceHandlers) GetKana() gin.HandlerFunc {
	return func(c *gin.Context) {
		kana, err := h.service.GetKana(c.Param("unicode"))
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

func (h *ServiceHandlers) GetKanaWriting() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Param("unicode") == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unicode is required"})
			return
		}
		kana, err := h.service.GetKanaWriting(c.Param("unicode"))
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

func (h *ServiceHandlers) GetKanaDisplay() gin.HandlerFunc {
	return func(c *gin.Context) {
		offset, err := parseOffsetQuery(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		search := &models.KanaSearch{Unicode: c.Query("unicode"), Literal: c.Query("literal"), Type: c.Query("type"), Reading: c.Query("reading")}
		kana, err := h.service.GetKanaDisplay(search, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}
		c.JSON(http.StatusOK, kana)
	}
}

func (h *ServiceHandlers) GetKanji() gin.HandlerFunc {
	return func(c *gin.Context) {
		kanji, err := h.service.GetKanji(c.Param("unicode"))
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

func (h *ServiceHandlers) GetKanjiWriting() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Param("unicode") == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unicode is required"})
			return
		}
		kanji, err := h.service.GetKanjiWriting(c.Param("unicode"))
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

func (h *ServiceHandlers) GetKanjiDisplay() gin.HandlerFunc {
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
		kanji, err := h.service.GetKanjiDisplay(search, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}
		c.JSON(http.StatusOK, kanji)
	}
}
