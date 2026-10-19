package main

import (
	"fmt"
	"freehongo-api/internal/db"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main(){
	if err := godotenv.Load("../.env"); err != nil {
    	fmt.Println("dotenv error:", err)
	}
	
	database := db.Connect()
	
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://127.0.0.1:4300"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Content-Type"},
		AllowCredentials: true,
	}))
	SetupRoutes(router, database)
	
	fmt.Println("Freehongo API Running!")
	router.Run(":2582")
}