package models

type GoogleAuthRequest struct {
	Credential string `json:"credential" binding:"required"`
}