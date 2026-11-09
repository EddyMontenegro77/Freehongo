package handlers

import (
	"context"
	"errors"
	"freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/quizes/models"
	"freehongo-api/internal/quizes/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

const maxSubmitBodyBytes = 2 << 20 // 2 MB

type QuizService interface {
	SubmitQuizSession(ctx context.Context, userId string, req models.SubmitQuizRequest) error

	FetchUserQuizSessions(ctx context.Context, userId string, req models.FetchUserQuizSessionsRequest) (models.QuizSessionsGroup, error)
	FetchQuizSessionDetail(ctx context.Context, userId string, req models.FetchQuizSessionDetailRequest) (models.QuizSessionDetail, error)
	FetchCharacterStats(ctx context.Context, userId string, req models.FetchCharacterStatsRequest) (models.CharacterStatsGroup, error)
	FetchListStats(ctx context.Context, userId string, req models.FetchListStatsRequest) (models.ListStats, error)
	FetchWeakCharacters(ctx context.Context, userId string, req models.FetchWeakCharactersRequest) (models.CharacterStatsGroup, error)
}

func PostSubmitQuizSession(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSubmitBodyBytes)

		var req models.SubmitQuizRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{
					"error": "payload_too_large",
				})
				return
			}
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		err := quizService.SubmitQuizSession(c.Request.Context(), userId, req)
		if err != nil {
			utils.HandleQuizError(c, err)
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message":"quiz_created"})
	}
}

func GetUserQuizSessions(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context){
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchUserQuizSessionsRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		sessions, err := quizService.FetchUserQuizSessions(c.Request.Context(), userId, req)
		if err != nil{
			utils.HandleQuizError(c, err) 
			return
		}

		c.JSON(http.StatusOK, sessions)
	}
}

func GetQuizSessionDetail(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context){
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchQuizSessionDetailRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		sessionDetails, err := quizService.FetchQuizSessionDetail(c.Request.Context(), userId, req)
		if err != nil{
			utils.HandleQuizError(c, err) 
			return
		}

		c.JSON(http.StatusOK, sessionDetails)
	}
}

func GetListStats(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchListStatsRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		stats, err := quizService.FetchListStats(c.Request.Context(), userId, req)
		if err != nil {
			utils.HandleQuizError(c, err)
			return
		}

		c.JSON(http.StatusOK, stats)
	}
}

func GetCharacterStats(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context){
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchCharacterStatsRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		characterStats, err := quizService.FetchCharacterStats(c.Request.Context(), userId, req)
		if err != nil{
			utils.HandleQuizError(c, err) 
			return
		}

		c.JSON(http.StatusOK, characterStats)
	}
}

func GetWeakCharacters(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context){
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchWeakCharactersRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		weakCharacters, err := quizService.FetchWeakCharacters(c.Request.Context(), userId, req)
		if err != nil{
			utils.HandleQuizError(c, err) 
			return
		}

		c.JSON(http.StatusOK, weakCharacters)
	}
}