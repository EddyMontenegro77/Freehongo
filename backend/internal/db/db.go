package db

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

type Config struct {
	Host     string
	Port     string
	Name     string
	User     string
	Password string
}

func Connect(config Config) *sql.DB {
	connectionStr := fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=require",
		config.Host,
		config.Port,
		config.Name,
		config.User,
		config.Password,
	)

	db, err := sql.Open("postgres", connectionStr)
	if err != nil {
		panic(err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(2)
	db.SetConnMaxIdleTime(5 * time.Minute)
	db.SetConnMaxLifetime(30 * time.Minute)

	if err := db.Ping(); err != nil {
    	panic(fmt.Errorf("Could not connect to database: %w", err))
	}

	return db
}
