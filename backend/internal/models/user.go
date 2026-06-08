package models

import "time"

type Role string
type Domain string

const (
	RoleStudent     Role = "student"
	RoleDomainAdmin Role = "domain_admin"
	RoleMasterAdmin Role = "master_admin"
)

const (
	DomainGnS Domain = "GnS"
	DomainAnC Domain = "AnC"
	DomainSnT Domain = "SnT"
	DomainMnC Domain = "MnC"
)

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Role      Role      `json:"role"`
	Domain    *Domain   `json:"domain"`
	CreatedAt time.Time `json:"created_at"`
}

type Profile struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	College   string    `json:"college"`
	Year      int       `json:"year"`
	Phone     string    `json:"phone"`
	PhotoURL  string    `json:"photo_url"`
	UpdatedAt time.Time `json:"updated_at"`
}