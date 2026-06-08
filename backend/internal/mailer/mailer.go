package mailer

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

func GenerateOTP() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	return fmt.Sprintf("%06d", n.Int64()+100000)
}

func SendOTP(toEmail string, otp string) error {
	host := os.Getenv("SMTP_HOST")
	portStr := os.Getenv("SMTP_PORT")
	from := os.Getenv("SMTP_EMAIL")
	password := os.Getenv("SMTP_PASSWORD")

	port, _ := strconv.Atoi(portStr)

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Your OTP - Student Verification Portal")
	m.SetBody("text/html", fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px;">
			<h2 style="color: #2563eb;">Student Verification Portal</h2>
			<p>Your OTP for registration is:</p>
			<div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; padding: 16px; background: #eff6ff; border-radius: 8px; text-align: center;">
				%s
			</div>
			<p style="color: #6b7280; margin-top: 16px;">This OTP expires in <strong>10 minutes</strong>.</p>
			<p style="color: #6b7280;">If you did not request this, ignore this email.</p>
		</div>
	`, otp))

	d := gomail.NewDialer(host, port, from, password)
	return d.DialAndSend(m)
}
func SendRequestStatusEmail(toEmail, studentName, domain, status string) error {
	host := os.Getenv("SMTP_HOST")
	portStr := os.Getenv("SMTP_PORT")
	from := os.Getenv("SMTP_EMAIL")
	password := os.Getenv("SMTP_PASSWORD")
	port, _ := strconv.Atoi(portStr)

	statusColor := "#16a34a"
	statusText := "Approved"
	statusMessage := "Congratulations! Your verification request has been approved."
	if status == "rejected" {
		statusColor = "#dc2626"
		statusText = "Rejected"
		statusMessage = "Unfortunately, your verification request has been rejected."
	}

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", fmt.Sprintf("Verification Request %s - %s Domain", statusText, domain))
	m.SetBody("text/html", fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
			<h2 style="color: #2563eb;">Student Verification Portal</h2>
			<p>Hi <strong>%s</strong>,</p>
			<p>%s</p>
			<div style="padding: 16px; border-radius: 8px; background: #f8fafc; border-left: 4px solid %s; margin: 20px 0;">
				<p style="margin: 0;"><strong>Domain:</strong> %s</p>
				<p style="margin: 8px 0 0;"><strong>Status:</strong> <span style="color: %s; font-weight: bold;">%s</span></p>
			</div>
			<p style="color: #6b7280;">Login to the portal to view your verification card.</p>
		</div>
	`, studentName, statusMessage, statusColor, domain, statusColor, statusText))

	d := gomail.NewDialer(host, port, from, password)
	return d.DialAndSend(m)
}