package main

import (
	"fmt"
	"log"
	"os"

	authHandlers "freehongo-api/internal/auth/handlers"
	"freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/auth/repository"
	authServices "freehongo-api/internal/auth/services"
	"freehongo-api/internal/db"
	japaneseRepository "freehongo-api/internal/japanese/repository"
	japaneseServices "freehongo-api/internal/japanese/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		fmt.Println("dotenv error:", err)
	}

	database := db.Connect()

	verifier, err := authServices.NewGoogleVerifier(
		os.Getenv("GOOGLE_CLIENT_ID"),
	)
	if err != nil {
		log.Fatal(err)
	}

	userRepo := repository.NewUserRepository(database)
	googleSignInService := authServices.NewGoogleSignInService(
		userRepo,
	)
	freehongoAuthService := authServices.NewFreeHongoAuthService(userRepo)
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
		AllowOrigins:     []string{"https://127.0.0.1:4300"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
	}))

	SetupRoutes(router, Deps{
		UserRepo:        userRepo,
		PasswordAuth:    freehongoAuthService,
		GoogleAuth:      googleAuthHandler,
		RequireAuth:     authMiddleware,
		JapaneseService: japaneseService,
	})

	if os.Getenv("APP_ENV") == "development" {
		certFile := os.Getenv("TLS_CERT_FILE")
		keyFile := os.Getenv("TLS_KEY_FILE")

		fmt.Println("Freehongo API Running on https://127.0.0.1:2582")
		if err := router.RunTLS(":2582", certFile, keyFile); err != nil {
			log.Fatal(err)
		}
		return
	}

	fmt.Println("Freehongo API Running on :2582")
	if err := router.Run(":2582"); err != nil {
		log.Fatal(err)
	}
}
