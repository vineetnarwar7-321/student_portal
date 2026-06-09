package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"student_verification/backend/internal/db"
	"student_verification/backend/internal/mailer"
)



func GetDomainRequests(c *gin.Context) {
	adminDomain := c.GetString("domain")

	if adminDomain == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "No domain assigned to this admin"})
		return
	}

	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT r.id::text, r.student_id::text, u.name, u.email,
			r.domain::text, r.status::text,
			COALESCE(r.message, ''),
			COALESCE(r.admin_note, ''),
			r.submitted_at::text
		FROM requests r
		JOIN users u ON u.id = r.student_id
		WHERE r.domain::text = $1
		ORDER BY r.submitted_at DESC`,
		adminDomain,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch requests"})
		return
	}
	defer rows.Close()

	type RequestRow struct {
		ID           string `json:"id"`
		StudentID    string `json:"student_id"`
		StudentName  string `json:"student_name"`
		StudentEmail string `json:"student_email"`
		Domain       string `json:"domain"`
		Status       string `json:"status"`
		Message      string `json:"message"`
		AdminNote    string `json:"admin_note"`
		SubmittedAt  string `json:"submitted_at"`
	}

	var requests []RequestRow
	for rows.Next() {
		var r RequestRow
		if err := rows.Scan(
			&r.ID, &r.StudentID, &r.StudentName,
			&r.StudentEmail, &r.Domain, &r.Status,
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



type ReviewInput struct {
	Status    string `json:"status"     binding:"required"`
	AdminNote string `json:"admin_note"`
}

func ReviewRequest(c *gin.Context) {
	adminID := c.GetString("user_id")
	adminDomain := c.GetString("domain")
	requestID := c.Param("id")

	var input ReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Status != "approved" && input.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be approved or rejected"})
		return
	}

	
	var reqDomain string
	err := db.Pool.QueryRow(
		context.Background(),
		`SELECT domain::text FROM requests WHERE id = $1`,
		requestID,
	).Scan(&reqDomain)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	if reqDomain != adminDomain {
		c.JSON(http.StatusForbidden, gin.H{"error": "This request does not belong to your domain"})
		return
	}

	
	_, err = db.Pool.Exec(
		context.Background(),
		`UPDATE requests
		SET status = $1, admin_note = $2, reviewed_at = now(), reviewed_by = $3
		WHERE id = $4`,
		input.Status,
		input.AdminNote,
		adminID,
		requestID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request"})
		return
	}

	
	var studentEmail, studentName, domainName string
	db.Pool.QueryRow(
		context.Background(),
		`SELECT u.email, u.name, r.domain::text
		FROM requests r
		JOIN users u ON u.id = r.student_id
		WHERE r.id = $1`,
		requestID,
	).Scan(&studentEmail, &studentName, &domainName)

	go mailer.SendRequestStatusEmail(studentEmail, studentName, domainName, input.Status)

	c.JSON(http.StatusOK, gin.H{
		"message": "Request " + input.Status + " successfully",
		"status":  input.Status,
	})
}