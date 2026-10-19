package handlers

import (
	"freehongo-api/internal/models"
	"net/http"

	//"freehongo-api/internal/repository"
	"os"

	"github.com/gin-gonic/gin"
	"google.golang.org/api/idtoken"
)

func PostGoogleAuth() gin.HandlerFunc {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")

	return  func(c *gin.Context) {
		var req models.GoogleAuthRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad_request"})
			return
		}

		payload, err := idtoken.Validate(c.Request.Context(), req.Credential, clientID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error":"invalid_google_token"})
			return 
		}

		email, _ := payload.Claims["email"].(string)
		verified, _ := payload.Claims["email_verified"].(bool)

		c.JSON(http.StatusOK, gin.H{
			"sub": payload.Subject,
			"email": email,
			"email_verified": verified,
		})
	}
}