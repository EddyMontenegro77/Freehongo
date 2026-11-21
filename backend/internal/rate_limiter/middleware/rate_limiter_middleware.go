package middleware

import (
	"net/http"
	"strconv"
	"time"

	authmiddleware "freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/rate_limiter/ratelimit"

	"github.com/gin-gonic/gin"
)

const (
	GeneralMaxRequests     = 100
	AuthMaxRequests        = 5
	ResetMaxRequests       = 2
	VerifyMaxRequests      = 2
	FailedLoginMaxAttempts = 10

	GeneralWindow     = time.Minute
	AuthWindow        = time.Minute
	ResetWindow       = 10 * time.Minute
	VerifyWindow      = time.Minute
	FailedLoginWindow = 15 * time.Minute
)

var (
	GeneralPolicy = ratelimit.RateLimiterPolicy{
		MaxTokenCapacity:    GeneralMaxRequests,
		TokensPerPeriod:     GeneralMaxRequests,
		ReplenishmentPeriod: GeneralWindow,
	}
	AuthPolicy = ratelimit.RateLimiterPolicy{
		MaxTokenCapacity:    AuthMaxRequests,
		TokensPerPeriod:     AuthMaxRequests,
		ReplenishmentPeriod: AuthWindow,
	}
	ResetPolicy = ratelimit.RateLimiterPolicy{
		MaxTokenCapacity:    ResetMaxRequests,
		TokensPerPeriod:     ResetMaxRequests,
		ReplenishmentPeriod: ResetWindow,
	}
	VerifyPolicy = ratelimit.RateLimiterPolicy{
		MaxTokenCapacity:    VerifyMaxRequests,
		TokensPerPeriod:     VerifyMaxRequests,
		ReplenishmentPeriod: VerifyWindow,
	}
	FailedLoginPolicy = ratelimit.RateLimiterPolicy{
		MaxTokenCapacity:    FailedLoginMaxAttempts,
		TokensPerPeriod:     FailedLoginMaxAttempts,
		ReplenishmentPeriod: FailedLoginWindow,
	}
)

type Limiters struct {
	general     *ratelimit.RateLimiter
	auth        *ratelimit.RateLimiter
	reset       *ratelimit.RateLimiter
	verify      *ratelimit.RateLimiter
	failedLogin *ratelimit.RateLimiter

	generalMiddleware gin.HandlerFunc
	authMiddleware    gin.HandlerFunc
	resetMiddleware   gin.HandlerFunc
	verifyMiddleware  gin.HandlerFunc
}

func NewLimiters() (*Limiters, error) {
	general, err := ratelimit.NewRateLimiter(GeneralPolicy)
	if err != nil {
		return nil, err
	}
	auth, err := ratelimit.NewRateLimiter(AuthPolicy)
	if err != nil {
		return nil, err
	}
	reset, err := ratelimit.NewRateLimiter(ResetPolicy)
	if err != nil {
		return nil, err
	}
	verify, err := ratelimit.NewRateLimiter(VerifyPolicy)
	if err != nil {
		return nil, err
	}
	failedLogin, err := ratelimit.NewRateLimiter(FailedLoginPolicy)
	if err != nil {
		return nil, err
	}

	return &Limiters{
		general:           general,
		auth:              auth,
		reset:             reset,
		verify:            verify,
		failedLogin:       failedLogin,
		generalMiddleware: New(general, ByUserAndIP),
		authMiddleware:    New(auth, ByIP),
		resetMiddleware:   New(reset, ByIP),
		verifyMiddleware:  New(verify, ByUserAndIP),
	}, nil
}

func (l *Limiters) Start() {
	l.general.Start()
	l.auth.Start()
	l.reset.Start()
	l.verify.Start()
	l.failedLogin.Start()
}

func (l *Limiters) Close() {
	l.general.Close()
	l.auth.Close()
	l.reset.Close()
	l.verify.Close()
	l.failedLogin.Close()
}

func (l *Limiters) General() gin.HandlerFunc            { return l.generalMiddleware }
func (l *Limiters) Auth() gin.HandlerFunc               { return l.authMiddleware }
func (l *Limiters) Reset() gin.HandlerFunc              { return l.resetMiddleware }
func (l *Limiters) Verify() gin.HandlerFunc             { return l.verifyMiddleware }
func (l *Limiters) FailedLogin() *ratelimit.RateLimiter { return l.failedLogin }

func New(limiter *ratelimit.RateLimiter, key func(*gin.Context) string) gin.HandlerFunc {
	return func(c *gin.Context) {
		allowed, retryAfter := limiter.Allow(key(c))
		if allowed {
			c.Next()
			return
		}

		c.Header("Retry-After", retryAfterHeader(retryAfter))
		c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
			"error": "rate_limit_exceeded",
		})
	}
}

func ByIP(c *gin.Context) string {
	return "ip:" + c.ClientIP()
}

func ByUserAndIP(c *gin.Context) string {
	userID, ok := authmiddleware.UserID(c)
	if !ok {
		return ByIP(c)
	}
	return "user:" + userID + "|ip:" + c.ClientIP()
}

func retryAfterHeader(d time.Duration) string {
	return strconv.Itoa(ratelimit.RetryAfterSeconds(d))
}
