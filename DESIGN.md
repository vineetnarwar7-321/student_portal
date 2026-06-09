# DESIGN.md — Student Verification Portal

---

## 1. Database Design

The database has three  tables.

### `users`
This is the single source of truth for everyone in the system — students, domain admins, and the master admin. I did not create separate tables for each role. Instead, each row has a `role` column (a PostgreSQL ENUM: `student`, `domain_admin`, `master_admin`) and an optional `domain` column that is only populated for domain admins.

```
users
├── id          UUID (primary key, auto-generated)
├── name        TEXT
├── email       TEXT (unique — enforced at DB level)
├── password    TEXT (bcrypt hash, never plain text)
├── role        user_role ENUM
├── domain      domain_name ENUM (NULL for students and master admin)
└── created_at  TIMESTAMPTZ
```

The four domains — `GnS`, `AnC`, `SnT`, `MnC` — are a fixed PostgreSQL ENUM called `domain_name`. They cannot be changed without a migration, which is intentional. These domains are fixed by design.

### `profiles`
Separated from `users` deliberately. The `users` table handles identity and auth. The `profiles` table handles everything about a student that can change — college, year, phone, photo. Each profile row has a foreign key to `users.id` with `ON DELETE CASCADE`, so if a user is deleted their profile goes too.

```
profiles
├── id          UUID
├── user_id     UUID → users.id (unique, cascade delete)
├── college     TEXT
├── year        INT
├── phone       TEXT
├── photo_url   TEXT
└── updated_at  TIMESTAMPTZ
```

### `requests`
This is the join between students and domains. A student submits a row here and a domain admin updates it. The `status` column is another ENUM: `pending`, `approved`, `rejected`. The `reviewed_by` column records which admin took action .

```
requests
├── id           UUID
├── student_id   UUID → users.id
├── domain       domain_name ENUM
├── status       request_status ENUM (default: pending)
├── submitted_at TIMESTAMPTZ
├── reviewed_at  TIMESTAMPTZ (NULL until reviewed)
└── reviewed_by  UUID → users.id (NULL until reviewed)
```

A student can have up to 4 rows in `requests` — one per domain. The combination of `student_id + domain` must be unique for active (pending/approved) requests. If a request is rejected, the student can delete it and reapply.

---

## 2. How Domain Admin Access Control Works

There are two layers of enforcement, not one.

**Layer 1 — JWT token**

When a domain admin logs in, the JWT payload includes their assigned domain:

```json
{
  "user_id": "...",
  "role": "domain_admin",
  "domain": "GnS"
}
```

This domain value is stored in the token at login time, pulled directly from the `users.domain` column.

**Layer 2 — Server-side query filtering**

Even if someone tampered with a token, the backend double-checks. When a domain admin hits `GET /api/admin/requests`, the handler reads the domain from the verified JWT claims and filters the query:

```go
adminDomain := c.GetString("domain")  // from JWT middleware

SELECT ... FROM requests r
JOIN users u ON u.id = r.student_id
WHERE r.domain::text = $1            -- only their domain
```

And when they try to approve/reject a specific request (`PATCH /api/admin/requests/:id`), the handler fetches that request's domain from the database and compares it to the admin's domain before doing anything:

```go
// fetch domain of the request being reviewed
SELECT domain::text FROM requests WHERE id = $1

// compare with admin's domain from JWT
if reqDomain != adminDomain {
    return 403 Forbidden
}
```

So even if an admin somehow knew another domain's request ID and sent a PATCH request, the server would reject it. The check is on the data, not just the route.

---

## 3. Verified Card and PDF Report

### Verified Card

The student card is built entirely on the frontend. When a student opens `/student/card`, the page calls:

```
GET /api/student/verified
```

The backend runs this query — it only returns domains where status is `approved`:

```sql
SELECT domain::text FROM requests
WHERE student_id = $1 AND status = 'approved'
```

The frontend receives an array like `["GnS", "SnT"]` and renders a badge for each one. Pending and rejected domains are never returned by this endpoint, so they never appear on the card. The card also pulls the student's name, email, college, and photo from the profile endpoint and lays them out as a visual card with domain color coding.

### PDF Report

The PDF is generated server-side in Go using the `gofpdf` library. When the master admin hits `GET /api/master/report`, the handler:

1. Queries all students with their profile data (name, email, college, year, phone) using a LEFT JOIN between `users` and `profiles`
2. For each student, runs a second query to fetch their approved domains from `requests`
3. Builds a formatted A4 PDF table row by row using `gofpdf`
4. Streams the PDF bytes directly to the HTTP response with `Content-Type: application/pdf`

The frontend triggers a download by setting `responseType: 'blob'` in the Axios call, creating an object URL from the blob, and clicking it programmatically. No file is saved on the server — the PDF is generated fresh on every request so it always reflects the current state of the database.
