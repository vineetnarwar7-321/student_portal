package handlers

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	"student_verification/backend/internal/db"
)

func GenerateStudentReport(c *gin.Context) {
	
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT u.id, u.name, u.email,
			COALESCE(p.college, 'N/A'),
			COALESCE(p.year::text, 'N/A'),
			COALESCE(p.phone, 'N/A')
		FROM users u
		LEFT JOIN profiles p ON p.user_id = u.id
		WHERE u.role = 'student'
		ORDER BY u.name`,
	)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch students"})
		return
	}
	defer rows.Close()

	type StudentData struct {
		ID      string
		Name    string
		Email   string
		College string
		Year    string
		Phone   string
		Domains []string
	}

	var students []StudentData
	for rows.Next() {
		var s StudentData
		if err := rows.Scan(&s.ID, &s.Name, &s.Email, &s.College, &s.Year, &s.Phone); err != nil {
			continue
		}

		
		dRows, err := db.Pool.Query(
			context.Background(),
			`SELECT domain FROM requests WHERE student_id = $1 AND status = 'approved'`,
			s.ID,
		)
		if err == nil {
			for dRows.Next() {
				var d string
				if err := dRows.Scan(&d); err == nil {
					s.Domains = append(s.Domains, d)
				}
			}
			dRows.Close()
		}

		if s.Domains == nil {
			s.Domains = []string{}
		}
		students = append(students, s)
	}

	
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	
	pdf.SetFont("Arial", "B", 18)
	pdf.CellFormat(190, 12, "Student Verification Report", "", 1, "C", false, 0, "")
	pdf.Ln(4)

	// table 
	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(52, 73, 94)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(40, 8, "Name", "1", 0, "C", true, 0, "")
	pdf.CellFormat(50, 8, "Email", "1", 0, "C", true, 0, "")
	pdf.CellFormat(35, 8, "College", "1", 0, "C", true, 0, "")
	pdf.CellFormat(15, 8, "Year", "1", 0, "C", true, 0, "")
	pdf.CellFormat(50, 8, "Verified Domains", "1", 1, "C", true, 0, "")

	
	pdf.SetFont("Arial", "", 9)
	pdf.SetTextColor(0, 0, 0)
	fill := false
	for _, s := range students {
		pdf.SetFillColor(235, 240, 245)
		domains := "None"
		if len(s.Domains) > 0 {
			domains = ""
			for i, d := range s.Domains {
				if i > 0 {
					domains += ", "
				}
				domains += d
			}
		}
		pdf.CellFormat(40, 7, s.Name, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(50, 7, s.Email, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(35, 7, s.College, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(15, 7, s.Year, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(50, 7, domains, "1", 1, "L", fill, 0, "")
		fill = !fill
	}

	
	pdf.Ln(6)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(190, 8, fmt.Sprintf("Total Students: %d", len(students)), "", 1, "L", false, 0, "")

	
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename=student_report.pdf")
	err = pdf.Output(c.Writer)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate PDF"})
		return
	}
}