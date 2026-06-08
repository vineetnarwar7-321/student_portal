package db
import (
	"log"
	"context"
	
)
func Migrate() {
	queries := []string{
		`CREATE TYPE user_role AS ENUM ('student', 'domain_admin', 'master_admin')
		 ON CONFLICT DO NOTHING`,

		`CREATE TYPE domain_name AS ENUM ('GnS', 'AnC', 'SnT', 'MnC')`,

		`CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected')`,

		`CREATE TABLE IF NOT EXISTS users (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name        TEXT NOT NULL,
			email       TEXT UNIQUE NOT NULL,
			password    TEXT NOT NULL,
			role        user_role NOT NULL DEFAULT 'student',
			domain      domain_name,
			created_at  TIMESTAMPTZ DEFAULT now()
		)`,

		`CREATE TABLE IF NOT EXISTS profiles (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id     UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
			college     TEXT,
			year        INT,
			phone       TEXT,
			photo_url   TEXT,
			updated_at  TIMESTAMPTZ DEFAULT now()
		)`,

		`CREATE TABLE IF NOT EXISTS requests (
			id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			student_id   UUID REFERENCES users(id) ON DELETE CASCADE,
			domain       domain_name NOT NULL,
			status       request_status NOT NULL DEFAULT 'pending',
			submitted_at TIMESTAMPTZ DEFAULT now(),
			reviewed_at  TIMESTAMPTZ,
			reviewed_by  UUID REFERENCES users(id)
		)`,
	}

	for _, q := range queries {
		_, err := Pool.Exec(context.Background(), q)
		if err != nil {
			log.Println("Migration warning (may already exist):", err)
		}
	}

	log.Println("Database migration complete")
}