package main

import (
	"errors"
	"fmt"
	"io/fs"
	"os"

	"freehongo-api/internal/db"

	"github.com/joho/godotenv"
)

type Config struct {
	APIHost            string
	APIPort            string
	APIAllowedOrigin   string
	AppEnv             string
	GoogleClientID     string
	ResendAPIKey       string
	SupabaseURL        string
	SupabaseServiceKey string
	TLSCertFile        string
	TLSKeyFile         string
	OfficialUserId	   string
	Database           db.Config
}

func LoadConfig() (Config, error) {
	if err := godotenv.Load("../.env"); err != nil && !errors.Is(err, fs.ErrNotExist) {
		return Config{}, fmt.Errorf("dotenv error: %w", err)
	}

	port := os.Getenv("API_PORT")
	if port == "" {
    	port = os.Getenv("PORT")
	}

	config := Config{
		APIHost:            os.Getenv("API_HOST"),
		APIPort:            port,
		APIAllowedOrigin:   os.Getenv("API_ALLOWED_ORIGIN"),
		AppEnv:             os.Getenv("APP_ENV"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ResendAPIKey:       os.Getenv("RESEND_API_KEY"),
		SupabaseURL:        os.Getenv("SUPABASE_URL"),
		SupabaseServiceKey: os.Getenv("SUPABASE_SERVICE_KEY"),
		TLSCertFile:        os.Getenv("TLS_CERT_FILE"),
		TLSKeyFile:         os.Getenv("TLS_KEY_FILE"),
		OfficialUserId:		os.Getenv("OFFICIAL_USER_ID"),
		Database: db.Config{
			Host: os.Getenv("DB_HOST"), Port: os.Getenv("DB_PORT"),
			Name: os.Getenv("DB_NAME"), User: os.Getenv("DB_USER"),
			Password: os.Getenv("DB_PASSWORD"),
		},
	}

	required := map[string]string{
		"API_HOST":             config.APIHost,
		"API_PORT":             config.APIPort,
		"API_ALLOWED_ORIGIN":   config.APIAllowedOrigin,
		"RESEND_API_KEY":       config.ResendAPIKey,
		"SUPABASE_URL":         config.SupabaseURL,
		"SUPABASE_SERVICE_KEY": config.SupabaseServiceKey,
		"OFFICIAL_USER_ID":		config.OfficialUserId,
		"DB_HOST":              config.Database.Host,
		"DB_PORT":              config.Database.Port,
		"DB_NAME":              config.Database.Name,
		"DB_USER":              config.Database.User,
		"DB_PASSWORD":          config.Database.Password,
	}
	for name, value := range required {
		if value == "" {
			return Config{}, fmt.Errorf("missing required environment variable: %s", name)
		}
	}
	if config.AppEnv == "development" && (config.TLSCertFile == "" || config.TLSKeyFile == "") {
		return Config{}, errors.New("TLS_CERT_FILE and TLS_KEY_FILE are required in development")
	}
	return config, nil
}
