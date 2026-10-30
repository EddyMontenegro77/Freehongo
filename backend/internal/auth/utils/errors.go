package utils

import (
	"errors"
	auth "freehongo-api/internal/auth/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleAuthError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, auth.ErrBadRequest):
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "bad_request",
		})

	case errors.Is(err, auth.ErrGoogleClientIDNotConfigured):
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "google_client_id_not_configured",
		})

	case errors.Is(err, auth.ErrInvalidGoogleToken):
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid_google_token",
		})

	case errors.Is(err, auth.ErrInvalidGoogleClaims):
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_google_claims"})

	case errors.Is(err, auth.ErrEmailNotVerified):
		c.JSON(http.StatusForbidden, gin.H{
			"error": "email_not_verified",
		})

	case errors.Is(err, auth.ErrInvalidCredentials):
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})

	case errors.Is(err, auth.ErrInvalidEmail):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_email"})

	case errors.Is(err, auth.ErrPasswordTooShort):
		c.JSON(http.StatusBadRequest, gin.H{"error": "password_too_short"})

	case errors.Is(err, auth.ErrPasswordTooLong):
		c.JSON(http.StatusBadRequest, gin.H{"error": "password_too_long"})

	case errors.Is(err, auth.ErrEmailTaken):
		c.JSON(http.StatusConflict, gin.H{"error": "email_already_registered"})

	case errors.Is(err, auth.ErrInvalidUsername):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_username"})

	case errors.Is(err, auth.ErrImageTooLarge):
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "image_too_large"})

	case errors.Is(err, auth.ErrUnsupportedImage):
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported_image"})

	case errors.Is(err, auth.ErrInvalidImage):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_image"})

	case errors.Is(err, auth.ErrEmailNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "email_not_found"})

	case errors.Is(err, auth.ErrInvalidActionToken):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_or_expired_token"})

	case errors.Is(err, auth.ErrRLSPolicyViolation):
		c.JSON(http.StatusInternalServerError, gin.H{"error": "rls_policy_violation"})

	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal_server_error",
		})
	}
}
