package handlers

import (
	"context"
	"net/http"
	"strings"

	"freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/utils"

	"github.com/gin-gonic/gin"
)

type EmailFlowService interface {
	RequestVerification(ctx context.Context, userID string) error
	RequestVerificationByEmail(ctx context.Context, email string) error
	VerifyEmail(ctx context.Context, token string) (models.Session, error)
	RequestPasswordReset(ctx context.Context, email string) error
	RequestPasswordResetForUser(ctx context.Context, userID string) error
	ResetPassword(ctx context.Context, token, password string) error
}

type EmailAddressRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type PasswordResetRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func PostRequestVerification(service EmailFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}
		if err := service.RequestVerification(c.Request.Context(), userID); err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	}
}

func PostRequestVerificationByEmail(service EmailFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req EmailAddressRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}
		if err := service.RequestVerificationByEmail(c.Request.Context(), req.Email); err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		// Always return the same response, whether the account exists or not.
		c.JSON(http.StatusOK, gin.H{"message": "verification_email_sent"})
	}
}

func GetVerifyEmail(service EmailFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		session, err := service.VerifyEmail(c.Request.Context(), strings.TrimSpace(c.Query("token")))
		if err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		setSessionCookie(c, session)
		c.JSON(http.StatusOK, gin.H{"message": "email_verified"})
	}
}

func PostRequestPasswordReset(service EmailFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req EmailAddressRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}
		if err := service.RequestPasswordReset(c.Request.Context(), req.Email); err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "password_reset_email_sent"})
	}
}

func PostRequestPasswordResetForUser(service EmailFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}
		if err := service.RequestPasswordResetForUser(c.Request.Context(), userID); err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "password_reset_email_sent"})
	}
}

func PostResetPassword(service EmailFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req PasswordResetRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleAuthError(c, models.ErrBadRequest)
			return
		}
		if err := service.ResetPassword(c.Request.Context(), req.Token, req.Password); err != nil {
			utils.HandleAuthError(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "password_reset"})
	}
}
