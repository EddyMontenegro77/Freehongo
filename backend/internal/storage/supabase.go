package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

const profileBucket = "freehongo-users-pfp"

type SupabaseStorage struct {
	baseURL    string
	serviceKey string
	client     *http.Client
}

func NewSupabaseStorage(baseURL, serviceKey string) *SupabaseStorage {
	return &SupabaseStorage{
		baseURL:    strings.TrimRight(baseURL, "/"),
		serviceKey: serviceKey,
		client:     http.DefaultClient,
	}
}

func (s *SupabaseStorage) Upload(ctx context.Context, path string, content []byte) error {
	return s.doObjectRequest(ctx, http.MethodPost, path, content)
}

func (s *SupabaseStorage) Delete(ctx context.Context, path string) error {
	return s.doObjectRequest(ctx, http.MethodDelete, path, nil)
}

func (s *SupabaseStorage) PublicURL(path string) string {
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "https://") || strings.HasPrefix(path, "http://") {
		return path
	}
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.baseURL, profileBucket, escapeObjectPath(path))
}

func (s *SupabaseStorage) ObjectPath(publicURL string) (string, bool) {
	prefix := fmt.Sprintf("%s/storage/v1/object/public/%s/", s.baseURL, profileBucket)
	if !strings.HasPrefix(publicURL, prefix) {
		if strings.HasPrefix(publicURL, "avatars/") {
			return publicURL, true
		}
		return "", false
	}
	path, err := url.PathUnescape(strings.TrimPrefix(publicURL, prefix))
	if err != nil || path == "" {
		return "", false
	}
	return path, true
}

func (s *SupabaseStorage) doObjectRequest(ctx context.Context, method, path string, content []byte) error {
	endpoint := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, profileBucket, escapeObjectPath(path))
	req, err := http.NewRequestWithContext(ctx, method, endpoint, bytes.NewReader(content))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.serviceKey)
	req.Header.Set("apikey", s.serviceKey)
	if method == http.MethodPost {
		req.Header.Set("Content-Type", "image/webp")
		req.Header.Set("Cache-Control", "3600")
		req.Header.Set("x-upsert", "true")
	}

	res, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(res.Body, 4<<10))
		return fmt.Errorf("supabase storage %s: status %d: %s", method, res.StatusCode, strings.TrimSpace(string(body)))
	}
	return nil
}

func escapeObjectPath(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for i, part := range parts {
		parts[i] = url.PathEscape(part)
	}
	return strings.Join(parts, "/")
}
