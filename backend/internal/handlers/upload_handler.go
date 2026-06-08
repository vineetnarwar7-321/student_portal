package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"student_verification/backend/internal/db"
)

func UploadPhoto(c *gin.Context) {
	userID := c.GetString("user_id")

	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No photo file provided"})
		return
	}

	
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only jpg, jpeg, png, webp files allowed"})
		return
	}

	
	if file.Size > 2*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be under 2MB"})
		return
	}

	
	filename := fmt.Sprintf("%s_%d%s", userID, time.Now().Unix(), ext)
	savePath := filepath.Join("uploads", "photos", filename)

	
	var oldPhotoURL string
	db.Pool.QueryRow(
		context.Background(),
		`SELECT COALESCE(photo_url, '') FROM profiles WHERE user_id = $1`,
		userID,
	).Scan(&oldPhotoURL)

	if oldPhotoURL != "" {
		oldPath := strings.TrimPrefix(oldPhotoURL, "/")
		os.Remove(oldPath)
	}

	
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save photo"})
		return
	}

	
	photoURL := "/" + savePath
	_, err = db.Pool.Exec(
		context.Background(),
		`UPDATE profiles SET photo_url = $1, updated_at = now() WHERE user_id = $2`,
		photoURL,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update photo URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Photo uploaded successfully",
		"photo_url": photoURL,
	})
}