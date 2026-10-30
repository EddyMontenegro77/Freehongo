package main

import (
	authHandlers "freehongo-api/internal/auth/handlers"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/services"
	japaneseHandlers "freehongo-api/internal/japanese/handlers"
	japaneseServices "freehongo-api/internal/japanese/services"
	"freehongo-api/internal/storage"

	"github.com/gin-gonic/gin"
)

type Deps struct {
	UserRepo       *repository.UserRepository
	PasswordAuth   *services.FreeHongoAuthService
	ProfileService authHandlers.ProfileAuthService
	ProfileStorage *storage.SupabaseStorage
	EmailFlows     authHandlers.EmailFlowService
	GoogleAuth     gin.HandlerFunc
	RequireAuth    gin.HandlerFunc

	JapaneseService *japaneseServices.JapaneseService
}

func SetupRoutes(router *gin.Engine, d Deps) {
	public := router.Group("/api")
	router.SetTrustedProxies(nil)

	authProtected := router.Group("/api")
	authProtected.Use(d.RequireAuth)

	// Auth PROTECTED
	authProtected.GET("/auth/me", authHandlers.GetMe(d.UserRepo, d.ProfileStorage))
	authProtected.PATCH("/auth/profile", authHandlers.PatchProfile(d.ProfileService, d.UserRepo, d.ProfileStorage))
	authProtected.POST("/auth/profile/picture", authHandlers.PostProfilePicture(d.ProfileService))
	authProtected.DELETE("/auth/profile", authHandlers.DeleteProfile(d.ProfileService))
	authProtected.POST("/auth/verify-email/request", authHandlers.PostRequestVerification(d.EmailFlows))
	authProtected.POST("/auth/profile/password-reset/request", authHandlers.PostRequestPasswordResetForUser(d.EmailFlows))

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
	public.GET("/auth/verify-email", authHandlers.GetVerifyEmail(d.EmailFlows))
	public.POST("/auth/password-reset/request", authHandlers.PostRequestPasswordReset(d.EmailFlows))
	public.POST("/auth/password-reset", authHandlers.PostResetPassword(d.EmailFlows))
}
