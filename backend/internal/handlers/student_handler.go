package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"student_verification/backend/internal/db"
)



func GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var profile struct {
		ID       string `json:"id"`
		UserID   string `json:"user_id"`
		Name     string `json:"name"`
		Email    string `json:"email"`
		College  string `json:"college"`
		Year     int    `json:"year"`
		Phone    string `json:"phone"`
		PhotoURL string `json:"photo_url"`
	}

	err := db.Pool.QueryRow(
		context.Background(),
		`SELECT p.id, p.user_id, u.name, u.email,
			COALESCE(p.college, ''),
			COALESCE(p.year, 0),
			COALESCE(p.phone, ''),
			COALESCE(p.photo_url, '')
		FROM profiles p
		JOIN users u ON u.id = p.user_id
		WHERE p.user_id = $1`,
		userID,
	).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.Name,
		&profile.Email,
		&profile.College,
		&profile.Year,
		&profile.Phone,
		&profile.PhotoURL,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// Update Profile 
type UpdateProfileInput struct {
	College  string `json:"college"`
	Year     int    `json:"year"`
	Phone    string `json:"phone"`
	PhotoURL string `json:"photo_url"`
}

func UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var input UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := db.Pool.Exec(
		context.Background(),
		`UPDATE profiles
		SET college = $1, year = $2, phone = $3, photo_url = $4, updated_at = now()
		WHERE user_id = $5`,
		input.College,
		input.Year,
		input.Phone,
		input.PhotoURL,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}