package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"student_verification/backend/internal/db"
)



type SubmitRequestInput struct {
	Domain  string `json:"domain"  binding:"required"`
	Message string `json:"message"`
}

func SubmitRequest(c *gin.Context) {
	userID := c.GetString("user_id")
	role := c.GetString("role")

	if role != "student" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students can submit requests"})
		return
	}

	var input SubmitRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	
	validDomains := map[string]bool{
		"GnS": true, "AnC": true, "SnT": true, "MnC": true,
	}
	if !validDomains[input.Domain] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid domain. Must be GnS, AnC, SnT or MnC"})
		return
	}

	
	var requestID string
	err := db.Pool.QueryRow(
		context.Background(),
		`INSERT INTO requests (student_id, domain, status, message)
		VALUES ($1, $2, 'pending', $3)
		RETURNING id`,
		userID,
		input.Domain,
		input.Message,
	).Scan(&requestID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Request submitted successfully",
		"request_id": requestID,
		"domain":     input.Domain,
		"status":     "pending",
	})
}



func GetMyRequests(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT id::text, domain::text, status::text,
			COALESCE(message, ''),
			COALESCE(admin_note, ''),
			submitted_at::text
		FROM requests
		WHERE student_id = $1
		ORDER BY submitted_at DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch requests"})
		return
	}
	defer rows.Close()

	type RequestRow struct {
		ID          string `json:"id"`
		Domain      string `json:"domain"`
		Status      string `json:"status"`
		Message     string `json:"message"`
		AdminNote   string `json:"admin_note"`
		SubmittedAt string `json:"submitted_at"`
	}

	var requests []RequestRow
	for rows.Next() {
		var r RequestRow
		if err := rows.Scan(
			&r.ID, &r.Domain, &r.Status,
			&r.Message, &r.AdminNote, &r.SubmittedAt,
		); err != nil {
			continue
		}
		requests = append(requests, r)
	}

	if requests == nil {
		requests = []RequestRow{}
	}

	c.JSON(http.StatusOK, requests)
}



func GetVerifiedDomains(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT id::text, domain::text, COALESCE(message, ''), COALESCE(admin_note, ''), submitted_at::text
		FROM requests
		WHERE student_id = $1 AND status = 'approved'
		ORDER BY submitted_at DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch verified domains"})
		return
	}
	defer rows.Close()

	type VerifiedRequest struct {
		ID          string `json:"id"`
		Domain      string `json:"domain"`
		Message     string `json:"message"`
		AdminNote   string `json:"admin_note"`
		SubmittedAt string `json:"submitted_at"`
	}

	var verified []VerifiedRequest
	for rows.Next() {
		var v VerifiedRequest
		if err := rows.Scan(&v.ID, &v.Domain, &v.Message, &v.AdminNote, &v.SubmittedAt); err != nil {
			continue
		}
		verified = append(verified, v)
	}

	if verified == nil {
		verified = []VerifiedRequest{}
	}

	c.JSON(http.StatusOK, gin.H{"verified_requests": verified})
}