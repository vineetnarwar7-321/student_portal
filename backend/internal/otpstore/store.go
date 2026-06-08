package otpstore

import (
	"sync"
	"time"
)

type otpEntry struct {
	OTP       string
	ExpiresAt time.Time
}

var (
	mu    sync.Mutex
	store = make(map[string]otpEntry)
)

func Save(email, otp string) {
	mu.Lock()
	defer mu.Unlock()
	store[email] = otpEntry{
		OTP:       otp,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
}

func Verify(email, otp string) bool {
	mu.Lock()
	defer mu.Unlock()
	entry, exists := store[email]
	if !exists {
		return false
	}
	if time.Now().After(entry.ExpiresAt) {
		delete(store, email)
		return false
	}
	if entry.OTP != otp {
		return false
	}
	delete(store, email)
	return true
}