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
	api.GET("/kana/writing/:unicode", handlers.GetKanaWriting(db))
	api.GET("/kana/display", handlers.GetKanaDisplay(db))
	
	api.GET("/kanji/:unicode", handlers.GetKanji(db))
	api.GET("/kanji/writing/:unicode", handlers.GetKanjiWriting(db))
	api.GET("/kanji/display", handlers.GetKanjiDisplay(db))

	// Auth Endpoints
	api.POST("/auth/google", handlers.PostGoogleAuth())
}