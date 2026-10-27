package main

import (
	authHandlers "freehongo-api/internal/auth/handlers"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/services"
	japaneseHandlers "freehongo-api/internal/japanese/handlers"
	japaneseServices "freehongo-api/internal/japanese/services"

	"github.com/gin-gonic/gin"
)

type Deps struct {
	UserRepo     *repository.UserRepository
	PasswordAuth *services.FreeHongoAuthService
	GoogleAuth   gin.HandlerFunc
	RequireAuth  gin.HandlerFunc

	JapaneseService *japaneseServices.JapaneseService
}

func SetupRoutes(router *gin.Engine, d Deps) {
	public := router.Group("/api")
	authProtected := router.Group("/api")
	authProtected.Use(d.RequireAuth)

	// Auth PROTECTED
	authProtected.GET("/auth/me", authHandlers.GetMe(d.UserRepo))

	// Japanese Endpoints
	public.GET("/kana/:unicode", japaneseHandlers.GetKanaFromService(d.JapaneseService))
	public.GET("/kana/writing/:unicode", japaneseHandlers.GetKanaWritingFromService(d.JapaneseService))
	public.GET("/kana/display", japaneseHandlers.GetKanaDisplayFromService(d.JapaneseService))

	public.GET("/kanji/:unicode", japaneseHandlers.GetKanjiFromService(d.JapaneseService))
	public.GET("/kanji/writing/:unicode", japaneseHandlers.GetKanjiWritingFromService(d.JapaneseService))
	public.GET("/kanji/display", japaneseHandlers.GetKanjiDisplayFromService(d.JapaneseService))

	// Auth Endpoints
	public.POST("/auth/google", d.GoogleAuth)
	public.POST("/auth/signup", authHandlers.PostSignUp(d.PasswordAuth))
	public.POST("/auth/login", authHandlers.PostLogin(d.PasswordAuth))
	public.POST("/auth/logout", authHandlers.PostLogout(d.PasswordAuth))
	// TODO: POST /auth/verify-email once an email provider is available.
	// TODO: POST /auth/forgot-password and /auth/reset-password.
}
