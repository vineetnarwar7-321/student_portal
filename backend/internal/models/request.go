package models

import "time"

type RequestStatus string

const (
	StatusPending  RequestStatus = "pending"
	StatusApproved RequestStatus = "approved"
	StatusRejected RequestStatus = "rejected"
)

type VerificationRequest struct {
	ID          string        `json:"id"`
	StudentID   string        `json:"student_id"`
	Domain      Domain        `json:"domain"`
	Status      RequestStatus `json:"status"`
	SubmittedAt time.Time     `json:"submitted_at"`
	ReviewedAt  *time.Time    `json:"reviewed_at"`
	ReviewedBy  *string       `json:"reviewed_by"`
}