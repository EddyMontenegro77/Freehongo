package middleware

import (
	"errors"
	"net/http"

	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/utils"

	"github.com/gin-gonic/gin"
)

const UserIDContextKey = "auth_user_id"

var errUnauthorized = errors.New("unauthorized")

func RequireAuth(users *repository.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawToken, err := c.Cookie(models.SessionCookieName)
		if err != nil || rawToken == "" {
			AbortUnauthorized(c)
			return
		}

		tokenHash := utils.HashSessionToken(rawToken)
		var userID string
		err = users.InTx(c.Request.Context(), func(q *repository.UserQueries) error {
			id, found, err := q.FindActiveSessionUser(c.Request.Context(), tokenHash)
			if err != nil {
				return err
			}
			if !found {
				return errUnauthorized
			}

			userID = id
			return q.TouchSession(c.Request.Context(), tokenHash)
		})

		if errors.Is(err, errUnauthorized) {
			AbortUnauthorized(c)
			return
		}
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "internal_server_error",
			})
			return
		}

		c.Set(UserIDContextKey, userID)
		c.Next()
	}
}

func UserID(c *gin.Context) (string, bool) {
	value, exists := c.Get(UserIDContextKey)
	if !exists {
		return "", false
	}
	userID, ok := value.(string)
	return userID, ok && userID != ""
}

func AbortUnauthorized(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"error": "unauthorized",
	})
}
