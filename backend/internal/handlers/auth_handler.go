package handlers

import (
	"context"
	"net/http"
	"regexp"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"student_verification/backend/internal/auth"
	"student_verification/backend/internal/db"
	"student_verification/backend/internal/mailer"
	"student_verification/backend/internal/models"
	"student_verification/backend/internal/otpstore"
)



func isValidIITKEmail(email string) bool {
	return strings.HasSuffix(strings.ToLower(email), "@iitk.ac.in")
}

func isValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	hasSpecial := false
	for _, c := range password {
		if unicode.IsPunct(c) || unicode.IsSymbol(c) {
			hasSpecial = true
			break
		}
	}
	return hasSpecial
}

func isValidEmail(email string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	return re.MatchString(email)
}



type SendOTPInput struct {
	Name     string `json:"name"     binding:"required"`
	Email    string `json:"email"    binding:"required"`
	Password string `json:"password" binding:"required"`
}

func SendOTP(c *gin.Context) {
	var input SendOTPInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	
	if !isValidEmail(input.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	
	if !isValidIITKEmail(input.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only @iitk.ac.in email addresses are allowed"})
		return
	}

	
	if !isValidPassword(input.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters and contain at least one special character"})
		return
	}

	
	var existingID string
	err := db.Pool.QueryRow(
		context.Background(),
		`SELECT id FROM users WHERE email = $1`,
		strings.ToLower(input.Email),
	).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	
	otp := mailer.GenerateOTP()
	otpstore.Save(strings.ToLower(input.Email), otp)

	err = mailer.SendOTP(input.Email, otp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP email: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "OTP sent to " + input.Email,
	})
}



type VerifyOTPInput struct {
	Name     string `json:"name"     binding:"required"`
	Email    string `json:"email"    binding:"required"`
	Password string `json:"password" binding:"required"`
	OTP      string `json:"otp"      binding:"required"`
}

func VerifyOTPAndRegister(c *gin.Context) {
	var input VerifyOTPInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))

	
	if !otpstore.Verify(email, input.OTP) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	
	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	
	var userID string
	err = db.Pool.QueryRow(
		context.Background(),
		`INSERT INTO users (name, email, password, role)
		VALUES ($1, $2, $3, 'student')
		RETURNING id`,
		strings.TrimSpace(input.Name),
		email,
		string(hashed),
	).Scan(&userID)

	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}

	
	db.Pool.Exec(
		context.Background(),
		`INSERT INTO profiles (user_id) VALUES ($1)`,
		userID,
	)

	
	token, err := auth.GenerateToken(userID, string(models.RoleStudent), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful",
		"token":   token,
		"user": gin.H{
			"id":    userID,
			"name":  input.Name,
			"email": input.Email,
			"role":  "student",
		},
	})
}



type LoginInput struct {
	Email    string `json:"email"    binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	var domainStr *string

	err := db.Pool.QueryRow(
		context.Background(),
		`SELECT id, name, email, password, role, domain
		FROM users WHERE email = $1`,
		strings.ToLower(strings.TrimSpace(input.Email)),
	).Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role, &domainStr)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	domainValue := ""
	if domainStr != nil {
		domainValue = *domainStr
	}

	token, err := auth.GenerateToken(user.ID, string(user.Role), domainValue)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user": gin.H{
			"id":     user.ID,
			"name":   user.Name,
			"email":  user.Email,
			"role":   user.Role,
			"domain": domainValue,
		},
	})
}



func Me(c *gin.Context) {
	userID := c.GetString("user_id")
	role := c.GetString("role")
	domain := c.GetString("domain")

	var user models.User
	err := db.Pool.QueryRow(
		context.Background(),
		`SELECT id, name, email, role FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Role)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":     user.ID,
		"name":   user.Name,
		"email":  user.Email,
		"role":   role,
		"domain": domain,
	})
}


type ForgotPasswordInput struct {
	Email string `json:"email" binding:"required"`
}

func SendResetOTP(c *gin.Context) {
	var input ForgotPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))

	
	var userID string
	err := db.Pool.QueryRow(
		context.Background(),
		`SELECT id FROM users WHERE email = $1`,
		email,
	).Scan(&userID)

	if err != nil {
		
		c.JSON(http.StatusOK, gin.H{"message": "If this email exists, an OTP has been sent"})
		return
	}

	// generate OTP
	otp := mailer.GenerateOTP()
	otpstore.Save("reset:"+email, otp)

	err = mailer.SendOTP(email, otp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "If this email exists, an OTP has been sent"})
}



type ResetPasswordInput struct {
	Email       string `json:"email"        binding:"required"`
	OTP         string `json:"otp"          binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func ResetPassword(c *gin.Context) {
	var input ResetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))

	
	if !isValidPassword(input.NewPassword) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters and contain at least one special character"})
		return
	}

	// verify OTP 
	if !otpstore.Verify("reset:"+email, input.OTP) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	
	result, err := db.Pool.Exec(
		context.Background(),
		`UPDATE users SET password = $1 WHERE email = $2`,
		string(hashed),
		email,
	)
	if err != nil || result.RowsAffected() == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully. You can now login."})
}