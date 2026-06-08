package router

import (
	"github.com/gin-gonic/gin"
	"student_verification/backend/internal/handlers"
	"student_verification/backend/internal/middleware"
)

func Setup() *gin.Engine {
	r := gin.Default()
	r.Static("/uploads", "./uploads")

	// CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// ── Public routes ─────────────────────────────────────────
	public := r.Group("/api")
	{
		//public.POST("/register", handlers.Register)
		public.POST("/auth/send-otp", handlers.SendOTP)
        public.POST("/auth/verify-otp", handlers.VerifyOTPAndRegister)
		public.POST("/login", handlers.Login)
		public.POST("/auth/forgot-password", handlers.SendResetOTP)
		public.POST("/auth/reset-password", handlers.ResetPassword)
	}

	// ── Auth required ─────────────────────────────────────────
	auth := r.Group("/api")
	auth.Use(middleware.AuthRequired())
	{
		auth.GET("/me", handlers.Me)
	}

	// ── Student routes ────────────────────────────────────────
	student := r.Group("/api/student")
	student.Use(middleware.AuthRequired())
	student.Use(middleware.RequireRole("student"))
	{
		student.GET("/profile", handlers.GetProfile)
		student.PUT("/profile", handlers.UpdateProfile)
		student.POST("/request", handlers.SubmitRequest)
		student.GET("/requests", handlers.GetMyRequests)
		student.GET("/verified", handlers.GetVerifiedDomains)
		student.POST("/upload-photo", handlers.UploadPhoto)
	}

	// ── Domain admin routes ───────────────────────────────────
	admin := r.Group("/api/admin")
	admin.Use(middleware.AuthRequired())
	admin.Use(middleware.RequireRole("domain_admin"))
	{
		admin.GET("/requests", handlers.GetDomainRequests)
		admin.PATCH("/requests/:id", handlers.ReviewRequest)
	}

	// ── Master admin routes ───────────────────────────────────
	master := r.Group("/api/master")
	master.Use(middleware.AuthRequired())
	master.Use(middleware.RequireRole("master_admin"))
	{
		master.POST("/create-admin", handlers.CreateDomainAdmin)
		master.GET("/students", handlers.GetAllStudents)
		master.GET("/admins", handlers.GetAllAdmins)
		master.GET("/report", handlers.GenerateStudentReport)
	}

	return r
}