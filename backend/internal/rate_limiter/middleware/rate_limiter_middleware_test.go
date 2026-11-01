package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"freehongo-api/internal/rate_limiter/ratelimit"

	"github.com/gin-gonic/gin"
)

func TestNewBlocksRequestsAndSetsRetryAfter(t *testing.T) {
	gin.SetMode(gin.TestMode)
	limiter, err := ratelimit.NewRateLimiter(ratelimit.RateLimiterPolicy{
		MaxTokenCapacity:    1,
		TokensPerPeriod:     1,
		ReplenishmentPeriod: time.Hour,
	})
	if err != nil {
		t.Fatalf("creating limiter: %v", err)
	}

	router := gin.New()
	router.Use(New(limiter, ByIP))
	router.GET("/", func(c *gin.Context) { c.Status(http.StatusNoContent) })

	first := httptest.NewRecorder()
	router.ServeHTTP(first, httptest.NewRequest(http.MethodGet, "/", nil))
	if first.Code != http.StatusNoContent {
		t.Fatalf("first request status = %d, want %d", first.Code, http.StatusNoContent)
	}

	second := httptest.NewRecorder()
	router.ServeHTTP(second, httptest.NewRequest(http.MethodGet, "/", nil))
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("second request status = %d, want %d", second.Code, http.StatusTooManyRequests)
	}
	if got := second.Header().Get("Retry-After"); got != "3600" {
		t.Fatalf("Retry-After = %q, want %q", got, "3600")
	}
	if second.Body.String() != `{"error":"rate_limit_exceeded"}` {
		t.Fatalf("body = %q", second.Body.String())
	}
}

func TestByUserAndIPIncludesBothParts(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	c.Set("auth_user_id", "user-123")

	if got, want := ByUserAndIP(c), "user:user-123|ip:"+c.ClientIP(); got != want {
		t.Fatalf("key = %q, want %q", got, want)
	}
}

func TestLimiterCheckDoesNotConsumeAndResetClearsBucket(t *testing.T) {
	limiter, err := ratelimit.NewRateLimiter(ratelimit.RateLimiterPolicy{
		MaxTokenCapacity:    1,
		TokensPerPeriod:     1,
		ReplenishmentPeriod: time.Hour,
	})
	if err != nil {
		t.Fatalf("creating limiter: %v", err)
	}

	if allowed, _ := limiter.Check("email@example.com"); !allowed {
		t.Fatal("first check should be allowed")
	}
	if allowed, _ := limiter.Check("email@example.com"); !allowed {
		t.Fatal("check should not consume a token")
	}
	if allowed, _ := limiter.Allow("email@example.com"); !allowed {
		t.Fatal("allow should consume the available token")
	}
	if allowed, _ := limiter.Check("email@example.com"); allowed {
		t.Fatal("check should be blocked after consuming the token")
	}

	limiter.Reset("email@example.com")
	if allowed, _ := limiter.Check("email@example.com"); !allowed {
		t.Fatal("reset should clear the bucket")
	}
}
