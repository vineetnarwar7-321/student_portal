STUDENT VERIFICATION PORTAL
A full-stack web application for IITK students to get verified under campus domains — GnS, AnC, SnT, and MnC. Students apply, domain admins review, and a master admin oversees everything.
WHAT IT DOES:
Students sign up with their @iitk.ac.in email, verified via OTP
They apply for verification under one or more of the four fixed domains
Each domain has an admin who can approve or reject applications
Approved students get a verified card showing their domains
The master admin manages everything — creates domain admins, views all students, and downloads a PDF report
Students get an email when their request is reviewed
Backend - golang
Frontend - next.js
Auth - JWT(token)
Email - SMTP
DATABASE - Postgresql
clone the repo:
git clone git@github.com:vineetnarwar7-321/student_portal.git
cd student_portal
psql -U postgres
CREATE DATABASE student-verification
\q
cd backend
cp .env.example .env
go mod tidy
go run cmd/main.go
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local
npm install
npm run dev
psql -U postgres -d student_verification
create master admin:

INSERT INTO users (name, email, password, role)
VALUES ('Master Admin', 'admin@yourdomain.com', 'BCRYPT_HASH_HERE', 'master_admin');

Notes:

. Email validation on signup is restricted to @iitk.ac.in addresses only
. Passwords must be at least 8 characters and include one special character
. OTPs expire after 10 minutes
. Profile photos are stored locally under backend/uploads/photos/
. The PDF report is generated fresh on every request — not cached
. Domain admins are created by the master admin, not through the signup page
