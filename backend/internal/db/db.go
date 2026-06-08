package db

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Connect() {
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL is not set in .env")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	err = pool.Ping(context.Background())
	if err != nil {
		log.Fatal("Database is not reachable: ", err)
	}

	Pool = pool
	log.Println("Connected to PostgreSQL successfully")
}