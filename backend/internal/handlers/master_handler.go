package handlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"student_verification/backend/internal/db"
)



type CreateAdminInput struct {
	Name     string `json:"name"     binding:"required"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Domain   string `json:"domain"   binding:"required"`
}

func CreateDomainAdmin(c *gin.Context) {
	var input CreateAdminInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validDomains := map[string]bool{
		"GnS": true, "AnC": true, "SnT": true, "MnC": true,
	}
	if !validDomains[input.Domain] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid domain"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	var adminID string
	err = db.Pool.QueryRow(
		context.Background(),
		`INSERT INTO users (name, email, password, role, domain)
		VALUES ($1, $2, $3, 'domain_admin', $4)
		RETURNING id`,
		strings.TrimSpace(input.Name),
		strings.ToLower(strings.TrimSpace(input.Email)),
		string(hashed),
		input.Domain,
	).Scan(&adminID)

	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Domain admin created successfully",
		"id":      adminID,
		"name":    input.Name,
		"email":   input.Email,
		"domain":  input.Domain,
		"role":    "domain_admin",
	})
}



func GetAllStudents(c *gin.Context) {
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT u.id, u.name, u.email, u.created_at,
			COALESCE(p.college, ''),
			COALESCE(p.year, 0),
			COALESCE(p.phone, '')
		FROM users u
		LEFT JOIN profiles p ON p.user_id = u.id
		WHERE u.role = 'student'
		ORDER BY u.created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}
	defer rows.Close()

	type StudentRow struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		CreatedAt string `json:"created_at"`
		College   string `json:"college"`
		Year      int    `json:"year"`
		Phone     string `json:"phone"`
	}

	var students []StudentRow
	for rows.Next() {
		var s StudentRow
		if err := rows.Scan(
			&s.ID, &s.Name, &s.Email, &s.CreatedAt,
			&s.College, &s.Year, &s.Phone,
		); err != nil {
			continue
		}
		students = append(students, s)
	}

	if students == nil {
		students = []StudentRow{}
	}

	c.JSON(http.StatusOK, students)
}


func GetAllAdmins(c *gin.Context) {
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT id, name, email, domain, created_at
		FROM users
		WHERE role = 'domain_admin'
		ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch admins"})
		return
	}
	defer rows.Close()

	type AdminRow struct {
		ID        string  `json:"id"`
		Name      string  `json:"name"`
		Email     string  `json:"email"`
		Domain    *string `json:"domain"`
		CreatedAt string  `json:"created_at"`
	}

	var admins []AdminRow
	for rows.Next() {
		var a AdminRow
		if err := rows.Scan(&a.ID, &a.Name, &a.Email, &a.Domain, &a.CreatedAt); err != nil {
			continue
		}
		admins = append(admins, a)
	}

	if admins == nil {
		admins = []AdminRow{}
	}

	c.JSON(http.StatusOK, admins)
}