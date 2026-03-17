package main

import (
	"database/sql"
	"freehongo-api/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, db *sql.DB){
	api := router.Group("/api")
	
	// Japanese Endpoints
	api.GET("/kana/:unicode", handlers.GetKana(db))
	api.GET("/kana/svg/:unicode", handlers.GetKanaSVG())
	
	api.GET("/kanji/:unicode", handlers.GetKanji(db))
	api.GET("/kanji/svg/:unicode", handlers.GetKanjiSVG())
}