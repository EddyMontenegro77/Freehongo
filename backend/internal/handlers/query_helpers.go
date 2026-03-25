package handlers

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func parseOffsetQuery(c *gin.Context) (int, error) {
	offsetValue := c.DefaultQuery("offset", "0")
	offset, err := strconv.Atoi(offsetValue)
	if err != nil {
		return 0, fmt.Errorf("offset must be a number")
	}
	if offset < 0 {
		return 0, fmt.Errorf("offset cannot be negative")
	}

	return offset, nil
}

func parseOptionalIntQuery(c *gin.Context, key string) (*int, error) {
	value := c.Query(key)
	if value == "" {
		return nil, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return nil, fmt.Errorf("%s must be a number", key)
	}

	return &parsed, nil
}

func parseOptionalGradeLevelQuery(c *gin.Context, key string) (*int, error) {
	value := strings.TrimSpace(c.Query(key))
	if value == "" {
		return nil, nil
	}

	normalized := strings.ToLower(value)
	if strings.HasPrefix(normalized, "g") {
		normalized = strings.TrimPrefix(normalized, "g")
	}

	parsed, err := strconv.Atoi(normalized)
	if err != nil {
		return nil, fmt.Errorf("%s must be g1 to g10", key)
	}
	if parsed < 1 || parsed > 10 {
		return nil, fmt.Errorf("%s must be g1 to g10", key)
	}

	return &parsed, nil
}

func parseOptionalEnumQuery(c *gin.Context, key string, allowed map[string]struct{}) (string, error) {
	value := strings.TrimSpace(c.Query(key))
	if value == "" {
		return "", nil
	}

	if _, ok := allowed[value]; !ok {
		return "", fmt.Errorf("%s has an invalid value", key)
	}

	return value, nil
}
