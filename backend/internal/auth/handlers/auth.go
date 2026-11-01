package handlers

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/utils"
	"freehongo-api/internal/rate_limiter/ratelimit"
	"freehongo-api/internal/storage"

	"github.com/gin-gonic/gin"
)

type GoogleTokenVerifier interface {
	VerifyGoogleToken(ctx context.Context, credential string) (models.GoogleIdentity, error)
}

type GoogleSignInService interface {
	SignIn(ctx context.Context, identity models.GoogleIdentity) (models.SignInResult, error)
}

type PasswordAuthService interface {
	SignUp(ctx context.Context, req models.RegisterRequest) (models.Session, error)
	SignIn(ctx context.Context, req models.LoginRequest) (models.Session, error)
	Logout(ctx context.Context, token string) error
}

type FailedLoginLimiter interface {
	Check(key string) (bool, time.Duration)
	Allow(key string) (bool, time.Duration)
	Reset(key string)
}

type ProfileAuthService interface {
	UpdateUsername(ctx context.Context, userID, username string) error
	UpdatePicture(ctx context.Context, userID, filename string, size int64, input io.Reader) error
	DeleteProfile(ctx context.Context, userID string) error
}

func PostGoogleAuth(verifier GoogleTokenVerifier, signInService GoogleSignInService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.GoogleAuthRequest
		if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Credential) == "" {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}

		identity, err := verifier.VerifyGoogleToken(c.Request.Context(), req.Credential)
		if err != nil {
			utils.HandleAuthError(c, err)
			return
		}

		result, err := signInService.SignIn(c.Request.Context(), identity)
		if err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		if result.Session == nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}

		setSessionCookie(c, *result.Session)
		c.JSON(http.StatusOK, result)
	}
}

func PostSignUp(auth PasswordAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		req, closePicture, err := bindSignUpRequest(c)
		if closePicture != nil {
			defer closePicture.Close()
		}
		if err != nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}

		session, err := auth.SignUp(c.Request.Context(), req)
		if err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		setSessionCookie(c, session)
		c.JSON(http.StatusCreated, session)
	}
}

func bindSignUpRequest(c *gin.Context) (models.RegisterRequest, io.Closer, error) {
	if strings.HasPrefix(strings.ToLower(c.GetHeader("Content-Type")), "multipart/") {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, (1<<20)+64<<10)
		if err := c.Request.ParseMultipartForm((1 << 20) + 64<<10); err != nil {
			return models.RegisterRequest{}, nil, err
		}
		req := models.RegisterRequest{
			Name:     c.PostForm("name"),
			Email:    c.PostForm("email"),
			Password: c.PostForm("password"),
		}
		fileHeader, err := c.FormFile("picture")
		if err == http.ErrMissingFile {
			return req, nil, nil
		}
		if err != nil {
			return models.RegisterRequest{}, nil, err
		}
		file, err := fileHeader.Open()
		if err != nil {
			return models.RegisterRequest{}, nil, err
		}
		req.Picture = file
		req.PictureName = fileHeader.Filename
		req.PictureSize = fileHeader.Size
		return req, file, nil
	}

	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		return models.RegisterRequest{}, nil, err
	}
	return req, nil, nil
}

func PostLogin(auth PasswordAuthService, failedAttempts FailedLoginLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}

		email := utils.NormalizeEmail(req.Email)
		if allowed, retryAfter := failedAttempts.Check(email); !allowed {
			writeRateLimitExceeded(c, retryAfter)
			return
		}

		session, err := auth.SignIn(c.Request.Context(), req)
		if err != nil {
			if errors.Is(err, models.ErrInvalidCredentials) {
				failedAttempts.Allow(email)
			}
			utils.HandleAuthError(c, err)
			return
		}
		failedAttempts.Reset(email)
		setSessionCookie(c, session)
		c.JSON(http.StatusOK, session)
	}
}

func writeRateLimitExceeded(c *gin.Context, retryAfter time.Duration) {
	c.Header("Retry-After", strconv.Itoa(ratelimit.RetryAfterSeconds(retryAfter)))
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate_limit_exceeded"})
}

func PostLogout(auth PasswordAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, _ := c.Cookie(models.SessionCookieName)
		if err := auth.Logout(c.Request.Context(), token); err != nil {
			utils.HandleAuthError(c, err)
			return
		}

		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie(models.SessionCookieName, "", -1, "/", "", true, true)
		c.Status(http.StatusNoContent)
	}
}

func GetMe(users *repository.UserRepository, objectStorage *storage.SupabaseStorage) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var profile models.UserProfile
		err := users.InTx(c.Request.Context(), userID, func(q *repository.UserQueries) error {
			var err error
			profile, err = q.FetchUserProfile(c.Request.Context(), userID)
			return err
		})
		if err != nil {
			if errors.Is(err, models.ErrRLSPolicyViolation) {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "rls_policy_violation"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_server_error"})
			return
		}
		profile.PictureUrl = objectStorage.PublicURL(profile.PictureUrl)
		c.JSON(http.StatusOK, profile)
	}
}

func PatchProfile(profileService ProfileAuthService, users *repository.UserRepository, objectStorage *storage.SupabaseStorage) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}
		var req models.UpdateProfileRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}
		username := req.Username
		if username == "" {
			username = req.Name
		}
		if err := profileService.UpdateUsername(c.Request.Context(), userID, username); err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		writeCurrentProfile(c, users, objectStorage, userID)
	}
}

func PostProfilePicture(profileService ProfileAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, (1<<20)+64<<10)
		fileHeader, err := c.FormFile("picture")
		if err != nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}
		file, err := fileHeader.Open()
		if err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		defer file.Close()
		if err := profileService.UpdatePicture(c.Request.Context(), userID, fileHeader.Filename, fileHeader.Size, file); err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	}
}

func DeleteProfile(profileService ProfileAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}
		if err := profileService.DeleteProfile(c.Request.Context(), userID); err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie(models.SessionCookieName, "", -1, "/", "", true, true)
		c.Status(http.StatusNoContent)
	}
}

func writeCurrentProfile(c *gin.Context, users *repository.UserRepository, objectStorage *storage.SupabaseStorage, userID string) {
	var profile models.UserProfile
	err := users.InTx(c.Request.Context(), userID, func(q *repository.UserQueries) error {
		var err error
		profile, err = q.FetchUserProfile(c.Request.Context(), userID)
		return err
	})
	if err != nil {
		utils.HandleAuthError(c, err)
		return
	}
	profile.PictureUrl = objectStorage.PublicURL(profile.PictureUrl)
	c.JSON(http.StatusOK, profile)
}

func setSessionCookie(c *gin.Context, session models.Session) {
	maxAge := int(time.Until(session.ExpiresAt).Seconds())
	if maxAge < 1 {
		maxAge = 1
	}
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(models.SessionCookieName, session.Token, maxAge, "/", "", true, true)
}
