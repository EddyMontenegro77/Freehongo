package main

import (
	"fmt"
	"freehongo-api/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main(){
	if err := godotenv.Load("../.env"); err != nil {
    	fmt.Println("dotenv error:", err)
	}
	
	database := db.Connect()
	
	router := gin.Default()
	SetupRoutes(router, database)
	
	fmt.Println("Freehongo API Running!")
	router.Run(":2582")
}