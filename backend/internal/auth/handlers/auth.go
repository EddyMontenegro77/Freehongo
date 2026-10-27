package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/utils"

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
		var req models.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
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

func PostLogin(auth PasswordAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}

		session, err := auth.SignIn(c.Request.Context(), req)
		if err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		setSessionCookie(c, session)
		c.JSON(http.StatusOK, session)
	}
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

func GetMe(users *repository.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var profile models.UserProfile
		err := users.InTx(c.Request.Context(), func(q *repository.UserQueries) error {
			var err error
			profile, err = q.FetchUserProfile(c.Request.Context(), userID)
			return err
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_server_error"})
			return
		}

		c.JSON(http.StatusOK, profile)
	}
}

func setSessionCookie(c *gin.Context, session models.Session) {
	maxAge := int(time.Until(session.ExpiresAt).Seconds())
	if maxAge < 1 {
		maxAge = 1
	}
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(models.SessionCookieName, session.Token, maxAge, "/", "", true, true)
}

// TODO: Add email verification once the email provider is available.
// TODO: Add password recovery once the email provider is available.
// TODO: Add account deletion using app.soft_delete_user.
