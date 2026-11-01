package db

import (
	"database/sql"
	"fmt"

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

	return db
}
