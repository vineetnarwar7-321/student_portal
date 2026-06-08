package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"student_verification/backend/internal/db"
	"student_verification/backend/internal/router"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	db.Connect()
	db.Migrate()

	r := router.Setup()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Server running on port " + port)
	r.Run(":" + port)
}