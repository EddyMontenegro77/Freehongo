package utils

import (
	"freehongo-api/internal/lists/models"
	"regexp"
	"strings"
)
 
const MaxCharsPerRequest = 500
var hexRe = regexp.MustCompile(`^[0-9a-f]{4,6}$`)
 
func NormalizeChars(in []string) ([]string, error) {
	if len(in) == 0 || len(in) > MaxCharsPerRequest {
		return nil, models.ErrInvalidChars
	}
 
	seen := make(map[string]struct{}, len(in))
	out := make([]string, 0, len(in))
	for _, c := range in {
		c = strings.ToLower(strings.TrimSpace(c))
		if !hexRe.MatchString(c) {
			return nil, models.ErrInvalidChars
		}
		if _, dup := seen[c]; dup {
			continue
		}
		seen[c] = struct{}{}
		out = append(out, c)
	}
	return out, nil
}