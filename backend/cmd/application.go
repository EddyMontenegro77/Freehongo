package main

import (
	"context"
	"database/sql"
	"fmt"

	authHandlers "freehongo-api/internal/auth/handlers"
	authMiddleware "freehongo-api/internal/auth/middleware"
	authRepository "freehongo-api/internal/auth/repository"
	authServices "freehongo-api/internal/auth/services"
	"freehongo-api/internal/db"
	emailServices "freehongo-api/internal/emails/services"
	japaneseRepository "freehongo-api/internal/japanese/repository"
	japaneseServices "freehongo-api/internal/japanese/services"
	listServices "freehongo-api/internal/lists/services"
	quizServices "freehongo-api/internal/quizes/services"
	ratelimitmiddleware "freehongo-api/internal/rate_limiter/middleware"
	"freehongo-api/internal/storage"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Application struct {
	Router               *gin.Engine
	RateLimiters         *ratelimitmiddleware.Limiters
	database             *sql.DB
	cancelPictureCleanup context.CancelFunc
}

func NewApplication(config Config) (*Application, error) {
	database := db.Connect(config.Database)
	txm := db.NewTxManager(database)
	verifier, err := authServices.NewGoogleVerifier(config.GoogleClientID)
	if err != nil {
		return nil, err
	}
	userRepo := authRepository.NewUserRepository(txm)
	mailer, err := emailServices.NewMailer(config.ResendAPIKey)
	if err != nil {
		return nil, err
	}
	objectStorage := storage.NewSupabaseStorage(config.SupabaseURL, config.SupabaseServiceKey)
	rateLimiters, err := ratelimitmiddleware.NewLimiters()
	if err != nil {
		return nil, fmt.Errorf("creating rate limiters: %w", err)
	}
	rateLimiters.Start()

	emailFlows := authServices.NewEmailFlows(userRepo, mailer, config.APIAllowedOrigin)
	googleSignInService := authServices.NewGoogleSignInService(userRepo)
	profileService := authServices.NewProfileService(userRepo, objectStorage)
	cleanupContext, cancelPictureCleanup := context.WithCancel(context.Background())
	profileService.StartPictureCleanup(cleanupContext)
	passwordAuth := authServices.NewFreeHongoAuthService(userRepo, profileService)
	kanaRepository := japaneseRepository.NewKanaRepository(database)
	kanjiRepository := japaneseRepository.NewKanjiRepository(database)
	japaneseService := japaneseServices.NewJapaneseService(kanaRepository, kanjiRepository)
	listService := listServices.NewListService(txm, config.OfficialUserId)
	quizService := quizServices.NewQuizService(txm)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{config.APIAllowedOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
	}))
	SetupRoutes(router, Deps{
		Database:        database,
		UserRepo:        userRepo,
		ProfileService:  profileService,
		ProfileStorage:  objectStorage,
		EmailFlows:      emailFlows,
		PasswordAuth:    passwordAuth,
		GoogleAuth:      authHandlers.PostGoogleAuth(verifier, googleSignInService),
		RequireAuth:     authMiddleware.RequireAuth(userRepo),
		RateLimiters:    rateLimiters,
		JapaneseService: japaneseService,
		ListService:     listService,
		QuizService:     quizService,
	})

	return &Application{
		Router:               router,
		RateLimiters:         rateLimiters,
		database:             database,
		cancelPictureCleanup: cancelPictureCleanup,
	}, nil
}

func (app *Application) Close() error {
	if app.cancelPictureCleanup != nil {
		app.cancelPictureCleanup()
	}
	app.RateLimiters.Close()
	return app.database.Close()
}

func (app *Application) Run(config Config) error {
	addr := ":" + config.APIPort
	if config.AppEnv == "development" {
		fmt.Printf("FreeHongo API Running on %s:%s\n", config.APIHost, config.APIPort)
		return app.Router.RunTLS(addr, config.TLSCertFile, config.TLSKeyFile)
	}
	fmt.Printf("FreeHongo API Running on %s\n", addr)
	return app.Router.Run(addr)
}
