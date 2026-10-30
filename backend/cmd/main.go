package main

import (
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"

	authHandlers "freehongo-api/internal/auth/handlers"
	"freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/auth/repository"
	authServices "freehongo-api/internal/auth/services"
	"freehongo-api/internal/db"
	emailServices "freehongo-api/internal/emails/services"
	japaneseRepository "freehongo-api/internal/japanese/repository"
	japaneseServices "freehongo-api/internal/japanese/services"
	"freehongo-api/internal/storage"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func mustGetenv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("missing required environment variable: %s", key)
	}
	return value
}

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			fmt.Println("dotenv: .env file not found, using process environment")
		} else {
			log.Fatalf("dotenv error: %v", err)
		}
	}

	apiHost := mustGetenv("API_HOST")
	apiAllowedOrigin := mustGetenv("API_ALLOWED_ORIGIN")
	apiPort := mustGetenv("API_PORT")

	database := db.Connect()

	verifier, err := authServices.NewGoogleVerifier(
		os.Getenv("GOOGLE_CLIENT_ID"),
	)
	if err != nil {
		log.Fatal(err)
	}

	userRepo := repository.NewUserRepository(database)
	mailer, err := emailServices.NewMailer(mustGetenv("RESEND_API_KEY"))
	if err != nil {
		log.Fatal(err)
	}
	emailFlows := authServices.NewEmailFlows(userRepo, mailer, apiAllowedOrigin)
	objectStorage := storage.NewSupabaseStorage(
		mustGetenv("SUPABASE_URL"),
		mustGetenv("SUPABASE_SERVICE_KEY"),
	)
	googleSignInService := authServices.NewGoogleSignInService(
		userRepo,
	)
	profileService := authServices.NewProfileService(userRepo, objectStorage)
	freehongoAuthService := authServices.NewFreeHongoAuthService(userRepo, profileService)
	googleAuthHandler := authHandlers.PostGoogleAuth(
		verifier,
		googleSignInService,
	)
	authMiddleware := middleware.RequireAuth(userRepo)

	kanaRepository := japaneseRepository.NewKanaRepository(database)
	kanjiRepository := japaneseRepository.NewKanjiRepository(database)
	japaneseService := japaneseServices.NewJapaneseService(kanaRepository, kanjiRepository)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{apiAllowedOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
	}))

	SetupRoutes(router, Deps{
		UserRepo:        userRepo,
		ProfileService:  profileService,
		ProfileStorage:  objectStorage,
		EmailFlows:      emailFlows,
		PasswordAuth:    freehongoAuthService,
		GoogleAuth:      googleAuthHandler,
		RequireAuth:     authMiddleware,
		JapaneseService: japaneseService,
	})

	addr := ":" + apiPort

	if os.Getenv("APP_ENV") == "development" {
		certFile := mustGetenv("TLS_CERT_FILE")
		keyFile := mustGetenv("TLS_KEY_FILE")

		fmt.Printf("Freehongo API Running on %s:%s\n", apiHost, apiPort)
		if err := router.RunTLS(addr, certFile, keyFile); err != nil {
			log.Fatal(err)
		}
		return
	}

	fmt.Printf("Freehongo API Running on %s\n", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal(err)
	}
}
