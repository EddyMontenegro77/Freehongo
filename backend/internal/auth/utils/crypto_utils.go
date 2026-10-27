package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

func GenerateUsername(email string) string {
    username, _, found := strings.Cut(email, "@")
    if !found || username == "" {
        return "Freehongo User"
    }

    return username
}

func GenerateSessionToken() (token string, tokenHash string, err error) {
	raw := make([]byte, 32)
	if _, err = rand.Read(raw); err != nil {
		return "", "", err
	}
	token = base64.RawURLEncoding.EncodeToString(raw)
	return token, HashSessionToken(token), nil
}

func HashSessionToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

type argon2Params struct {
	memoryKiB uint32
	time      uint32
	threads   uint8
	saltLen   uint32
	keyLen    uint32
}

var defaultParams = argon2Params{
	memoryKiB: 19 * 1024,
	time:      2,
	threads:   1,
	saltLen:   16,
	keyLen:    32,
}

var hashSlots = make(chan struct{}, 2)

var ErrInvalidPasswordHash = errors.New("invalid password hash format")

func HashPassword(password string) (string, error) {
	hashSlots <- struct{}{}
	defer func() { <-hashSlots }()

	p := defaultParams

	salt := make([]byte, p.saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	key := argon2.IDKey([]byte(password), salt, p.time, p.memoryKiB, p.threads, p.keyLen)

	return fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		p.memoryKiB, p.time, p.threads,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(key),
	), nil
}

func CheckPassword(encodedHash, password string) (bool, error) {
	p, salt, key, err := decodeHash(encodedHash)
	if err != nil {
		return false, err
	}

	hashSlots <- struct{}{}
	defer func() { <-hashSlots }()

	candidate := argon2.IDKey([]byte(password), salt, p.time, p.memoryKiB, p.threads, uint32(len(key)))

	return subtle.ConstantTimeCompare(key, candidate) == 1, nil
}

func decodeHash(encoded string) (p argon2Params, salt, key []byte, err error) {
	parts := strings.Split(encoded, "$")
	// ["", "argon2id", "v=19", "m=...,t=...,p=...", salt, key]
	if len(parts) != 6 || parts[1] != "argon2id" {
		return p, nil, nil, ErrInvalidPasswordHash
	}

	var version int
	if _, err = fmt.Sscanf(parts[2], "v=%d", &version); err != nil || version != argon2.Version {
		return p, nil, nil, ErrInvalidPasswordHash
	}

	if _, err = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &p.memoryKiB, &p.time, &p.threads); err != nil {
		return p, nil, nil, ErrInvalidPasswordHash
	}

	if salt, err = base64.RawStdEncoding.DecodeString(parts[4]); err != nil {
		return p, nil, nil, ErrInvalidPasswordHash
	}
	if key, err = base64.RawStdEncoding.DecodeString(parts[5]); err != nil {
		return p, nil, nil, ErrInvalidPasswordHash
	}

	return p, salt, key, nil
}